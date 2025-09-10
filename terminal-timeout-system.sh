#!/bin/bash

# Terminal Command Timeout Prevention System
# Prevents hanging commands in AI coding environments

# 1. TIMEOUT WRAPPER FUNCTION
execute_with_timeout() {
    local cmd="$1"
    local timeout_duration="${2:-30}"  # Default 30 seconds
    local log_file="${3:-/tmp/cmd_execution.log}"
    
    echo "$(date): Executing: $cmd" >> "$log_file"
    
    # Use timeout command with kill signal escalation
    timeout --preserve-status --kill-after=5s "${timeout_duration}s" \
        bash -c "$cmd" 2>&1 | tee -a "$log_file"
    
    local exit_code=$?
    
    if [ $exit_code -eq 124 ]; then
        echo "$(date): TIMEOUT - Command killed after ${timeout_duration}s" >> "$log_file"
        return 124
    elif [ $exit_code -eq 137 ]; then
        echo "$(date): FORCE KILLED - Command forcibly terminated" >> "$log_file"
        return 137
    else
        echo "$(date): Command completed with exit code: $exit_code" >> "$log_file"
        return $exit_code
    fi
}

# 2. PROCESS MONITOR AND KILLER
setup_process_monitor() {
    # Background process monitor
    (
        while true; do
            # Kill processes running longer than specified threshold
            ps -eo pid,etime,cmd --no-headers | while read pid etime cmd; do
                # Convert etime to seconds (handles formats: MM:SS, HH:MM:SS, DD-HH:MM:SS)
                seconds=$(echo "$etime" | awk -F: '{
                    if (NF==2) print $1*60 + $2
                    else if (NF==3) print $1*3600 + $2*60 + $3
                    else if (index($1,"-")) {
                        split($1,d,"-"); 
                        print d[1]*86400 + d[2]*3600 + $2*60 + $3
                    }
                }')
                
                # Kill if running > 5 minutes and matches patterns
                if [ "$seconds" -gt 300 ]; then
                    case "$cmd" in
                        *npm*|*yarn*|*pip*|*git*|*docker*|*node*)
                            echo "$(date): Killing long-running process: $pid ($cmd)"
                            kill -TERM "$pid" 2>/dev/null
                            sleep 2
                            kill -KILL "$pid" 2>/dev/null
                            ;;
                    esac
                fi
            done
            sleep 30
        done
    ) &
    
    echo $! > /tmp/process_monitor.pid
}

# 3. SMART COMMAND EXECUTION WITH FALLBACKS
smart_execute() {
    local cmd="$1"
    local max_retries="${2:-3}"
    local base_timeout="${3:-30}"
    
    for attempt in $(seq 1 $max_retries); do
        echo "Attempt $attempt/$max_retries: $cmd"
        
        # Progressive timeout increase
        local timeout=$((base_timeout * attempt))
        
        if execute_with_timeout "$cmd" "$timeout"; then
            echo "Command succeeded on attempt $attempt"
            return 0
        else
            local exit_code=$?
            echo "Command failed with exit code $exit_code on attempt $attempt"
            
            # Cleanup any hanging processes
            pkill -f "$cmd" 2>/dev/null
            
            if [ $attempt -lt $max_retries ]; then
                echo "Retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done
    
    echo "Command failed after $max_retries attempts"
    return 1
}

# 4. COMMAND QUEUE SYSTEM WITH AUTO-SKIP
declare -A command_queue
declare -A command_status

queue_command() {
    local id="$1"
    local cmd="$2"
    local timeout="${3:-60}"
    
    command_queue["$id"]="$cmd"
    command_status["$id"]="queued"
}

process_queue() {
    local max_failures="${1:-5}"
    local failure_count=0
    
    for cmd_id in "${!command_queue[@]}"; do
        if [ "${command_status[$cmd_id]}" = "queued" ]; then
            echo "Processing: $cmd_id"
            command_status["$cmd_id"]="running"
            
            if smart_execute "${command_queue[$cmd_id]}"; then
                command_status["$cmd_id"]="completed"
                failure_count=0  # Reset failure count on success
            else
                command_status["$cmd_id"]="failed"
                failure_count=$((failure_count + 1))
                
                if [ $failure_count -ge $max_failures ]; then
                    echo "Max failures reached. Skipping remaining commands."
                    break
                fi
            fi
        fi
    done
}

# 5. ENVIRONMENT HEALTH CHECK
health_check() {
    local issues=()
    
    # Check system resources
    if [ $(free | awk 'NR==2{printf "%.0f", $3/$2*100}') -gt 90 ]; then
        issues+=("High memory usage")
    fi
    
    # Check for zombie processes
    if [ $(ps aux | awk '$8 ~ /^Z/ { count++ } END { print count+0 }') -gt 0 ]; then
        issues+=("Zombie processes detected")
        # Clean up zombies
        kill -CHLD 1 2>/dev/null
    fi
    
    # Check disk space
    if [ $(df / | awk 'NR==2{print $5}' | sed 's/%//') -gt 90 ]; then
        issues+=("Low disk space")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        echo "Health issues detected:"
        printf '%s\n' "${issues[@]}"
        return 1
    fi
    
    return 0
}

# 6. MAIN EXECUTION WRAPPER
main() {
    # Initialize monitoring
    setup_process_monitor
    
    # Trap to cleanup on exit
    trap 'kill $(cat /tmp/process_monitor.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/process_monitor.pid' EXIT
    
    # Run health check
    if ! health_check; then
        echo "System health issues detected. Proceeding with caution."
    fi
    
    # Example usage:
    queue_command "setup" "npm install --timeout=60000"
    queue_command "build" "npm run build"
    queue_command "test" "npm test -- --timeout=30000"
    
    process_queue
}

# 7. INTEGRATION WITH AI CODING TOOLS
ai_code_execute() {
    local command="$1"
    local context="${2:-general}"
    
    # Set context-specific timeouts
    case "$context" in
        "install"|"setup")
            smart_execute "$command" 2 120  # 2 retries, 2-4 min timeout
            ;;
        "build"|"compile")
            smart_execute "$command" 3 180  # 3 retries, 3-9 min timeout
            ;;
        "test")
            smart_execute "$command" 1 60   # 1 retry, 1-2 min timeout
            ;;
        *)
            smart_execute "$command" 2 30   # Default: 2 retries, 30-60s timeout
            ;;
    esac
}

# Export functions for use in other scripts
export -f execute_with_timeout
export -f smart_execute
export -f ai_code_execute
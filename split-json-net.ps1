Add-Type -AssemblyName System.Text.Json

$inputFile = "C:\Users\cc\Downloads\geonames-all-cities-with-a-population-1000.json"
$outputFile1 = "C:\Users\cc\Downloads\geonames-part1.json"
$outputFile2 = "C:\Users\cc\Downloads\geonames-part2.json"

try {
    # Read the JSON file
    Write-Host "Reading JSON file..."
    $json = Get-Content -Path $inputFile -Raw | ConvertFrom-Json
    
    # Calculate split point
    $totalItems = $json.Count
    $half = [math]::Ceiling($totalItems / 2)
    
    # Split the array
    $part1 = $json[0..($half-1)]
    $part2 = $json[$half..($totalItems-1)]
    
    # Save first part
    Write-Host "Saving first part..."
    $options = [System.Text.Json.JsonSerializerOptions]::new()
    $options.WriteIndented = $false
    $json1 = [System.Text.Json.JsonSerializer]::Serialize($part1, $options)
    [System.IO.File]::WriteAllText($outputFile1, $json1, [System.Text.Encoding]::UTF8)
    
    # Save second part
    Write-Host "Saving second part..."
    $json2 = [System.Text.Json.JsonSerializer]::Serialize($part2, $options)
    [System.IO.File]::WriteAllText($outputFile2, $json2, [System.Text.Encoding]::UTF8)
    
    # Verify the output
    $file1 = Get-Item $outputFile1
    $file2 = Get-Item $outputFile2
    
    Write-Host "`nSplit complete!"
    Write-Host "First half: $($file1.FullName) ($([math]::Round($file1.Length/1MB, 2)) MB)"
    Write-Host "Second half: $($file2.FullName) ($([math]::Round($file2.Length/1MB, 2)) MB)"
    Write-Host "Total items: $totalItems"
    Write-Host "Part 1 items: $($part1.Count)"
    Write-Host "Part 2 items: $($part2.Count)"
}
catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace
}

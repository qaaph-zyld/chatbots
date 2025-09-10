$inputFile = "C:\Users\cc\Downloads\geonames-all-cities-with-a-population-1000.json"
$outputFile1 = "C:\Users\cc\Downloads\geonames-part1.json"
$outputFile2 = "C:\Users\cc\Downloads\geonames-part2.json"

# Read the file as raw text
Write-Host "Reading file..."
$json = Get-Content $inputFile -Raw

# Remove the outer brackets and split by "},{..." to get individual objects
$json = $json.Trim() -replace '^\[|\]$', ''
$items = $json -split '(?<=}),(?={)'

# Calculate split point
$totalItems = $items.Count
$half = [math]::Ceiling($totalItems / 2)

# Create first half
Write-Host "Creating first part..."
$part1 = $items[0..($half-1)] -join ","
"[$part1]" | Set-Content -Path $outputFile1 -Encoding UTF8 -NoNewline

# Create second half
Write-Host "Creating second part..."
$part2 = $items[$half..($totalItems-1)] -join ","
"[$part2]" | Set-Content -Path $outputFile2 -Encoding UTF8 -NoNewline

# Verify the output
$file1 = Get-Item $outputFile1
$file2 = Get-Item $outputFile2

Write-Host "`nSplit complete!"
Write-Host "First half: $($file1.FullName) ($([math]::Round($file1.Length/1MB, 2)) MB)"
Write-Host "Second half: $($file2.FullName) ($([math]::Round($file2.Length/1MB, 2)) MB)"
Write-Host "Total items: $totalItems"
Write-Host "Part 1 items: $half"
Write-Host "Part 2 items: $($totalItems - $half)"

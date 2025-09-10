$inputFile = "C:\Users\cc\Downloads\geonames-all-cities-with-a-population-1000.json"
$outputFile1 = "C:\Users\cc\Downloads\geonames-part1.json"
$outputFile2 = "C:\Users\cc\Downloads\geonames-part2.json"

# Read the input file
Write-Host "Reading input file..."
$json = Get-Content -Path $inputFile -Raw | ConvertFrom-Json
$totalItems = $json.Count
$half = [math]::Ceiling($totalItems / 2)

# Split the array
Write-Host "Splitting into two parts..."
$part1 = $json | Select-Object -First $half
$part2 = $json | Select-Object -Skip $half

# Save first half
Write-Host "Saving first part..."
$part1 | ConvertTo-Json -Depth 100 | Set-Content -Path $outputFile1 -Encoding UTF8

# Save second half
Write-Host "Saving second part..."
$part2 | ConvertTo-Json -Depth 100 | Set-Content -Path $outputFile2 -Encoding UTF8

Write-Host "Done! Files created:"
Write-Host "- $outputFile1"
Write-Host "- $outputFile2"
Write-Host "Total items: $totalItems"
Write-Host "Part 1 items: $($part1.Count)"
Write-Host "Part 2 items: $($part2.Count)"

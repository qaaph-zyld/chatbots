$inputFile = "C:\Users\cc\Downloads\geonames-all-cities-with-a-population-1000.json"
$outputFile1 = "C:\Users\cc\Downloads\geonames-part1.json"
$outputFile2 = "C:\Users\cc\Downloads\geonames-part2.json"

# Read the file as text
Write-Host "Reading file..."
$content = Get-Content -Path $inputFile -Raw

# Remove the opening and closing brackets
$content = $content.Trim() -replace '^\[|\]$', ''

# Split the content into individual JSON objects
$items = $content -split '(?<=}),\s*'
$totalItems = $items.Count
$half = [math]::Ceiling($totalItems / 2)

# Create the first half
Write-Host "Creating first part..."
$part1 = $items[0..($half-1)] -join ",\n"
"[$part1]" | Set-Content -Path $outputFile1 -Encoding UTF8

# Create the second half
Write-Host "Creating second part..."
$part2 = $items[$half..($totalItems-1)] -join ",\n"
"[$part2]" | Set-Content -Path $outputFile2 -Encoding UTF8

# Verify the files
$file1 = Get-Item $outputFile1
$file2 = Get-Item $outputFile2

Write-Host "`nSplit complete!"
Write-Host "First half: $($file1.FullName) ($([math]::Round($file1.Length/1MB, 2)) MB)"
Write-Host "Second half: $($file2.FullName) ($([math]::Round($file2.Length/1MB, 2)) MB)"
Write-Host "Total items: $totalItems"
Write-Host "Part 1 items: $half"
Write-Host "Part 2 items: $($totalItems - $half)"

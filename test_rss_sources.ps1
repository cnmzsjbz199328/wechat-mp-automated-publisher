
$sources = @{
    "Nature" = "https://www.nature.com/nature.rss";
    "ScienceDaily" = "https://www.sciencedaily.com/rss/all.xml";
    "FlightGlobal" = "https://www.flightglobal.com/rss/news";
    "NASA" = "https://www.nasa.gov/rss/dyn/breaking_news.rss";
    "ParisReview" = "https://www.theparisreview.org/feed";
    "LitHub" = "https://lithub.com/feed/";
    "ArsTechnica" = "https://feeds.arstechnica.com/arstechnica/index";
    "Wired" = "https://www.wired.com/feed/rss";
    "CNBC" = "https://www.cnbc.com/id/100003114/device/rss/rss.html"
}

$results = New-Object System.Collections.Generic.List[PSCustomObject]

foreach ($key in $sources.Keys) {
    $name = $key
    $url = $sources[$key]
    Write-Host "Testing $name : $url" -ForegroundColor Cyan
    try {
        $res = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -TimeoutSec 15
        $xml = [xml]$res.Content
        $item = $xml.rss.channel.item[0]
        
        $desc = ""
        if ($item.description) {
            $desc = $item.description.InnerText
        }

        $hasImg = "NO"
        if ($item.InnerXml -match "media:content|media:thumbnail|enclosure|<img") {
            $hasImg = "YES"
        }

        $results.Add([PSCustomObject]@{
            Source = $name
            Url = $url
            Status = "SUCCESS"
            HasAbstract = if ($desc.Length -gt 50) { "YES" } else { "NO" }
            AbstractLength = $desc.Length
            HasImage = $hasImg
            SampleTitle = $item.title
            SampleDesc = if ($desc.Length -gt 200) { $desc.Substring(0, 200) + "..." } else { $desc }
        })
    } catch {
        $results.Add([PSCustomObject]@{
            Source = $name
            Url = $url
            Status = "FAILED: $($_.Exception.Message)"
            HasAbstract = "N/A"
            AbstractLength = 0
            HasImage = "N/A"
            SampleTitle = ""
            SampleDesc = ""
        })
    }
}

$results | ConvertTo-Json | Set-Content "rss_eval_results.json" -Encoding utf8
Write-Host "`nTest completed. Results saved to rss_eval_results.json" -ForegroundColor Green

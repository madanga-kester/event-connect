# ==================== SEED EVENTS SCRIPT (PowerShell-Safe) ====================
# Run this to populate your Events table with test data
# Usage: .\seed-events.ps1 -Email "your@email.com" -Password "yourpass"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$API_BASE = "http://localhost:5260/api"
$ERROR_COUNT = 0

Write-Host "Starting event seed..." -ForegroundColor Cyan

# ==================== STEP 1: LOGIN TO GET TOKEN ====================
Write-Host "Authenticating..." -ForegroundColor Yellow

$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    if (-not $loginResponse.isSuccess) {
        throw "Login failed: $($loginResponse.message)"
    }
    
    $token = $loginResponse.token
    Write-Host "Authenticated successfully" -ForegroundColor Green
}
catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ==================== STEP 2: GET AVAILABLE INTERESTS ====================
Write-Host "Fetching available interests..." -ForegroundColor Yellow

try {
    $interestsResponse = Invoke-RestMethod -Uri "$API_BASE/interest/all"
    $interests = $interestsResponse.value
    Write-Host "Found $($interests.Count) interests" -ForegroundColor Green
}
catch {
    Write-Host "Failed to fetch interests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Helper to find interest by name
function Get-InterestId($name) {
    $interest = $interests | Where-Object { $_.name -eq $name }
    return $interest.id
}

# ==================== STEP 3: DEFINE TEST EVENTS (Safe Strings) ====================
$testEvents = @(
    @{
        Title = "Nairobi Tech Meetup: AI and Startups"
        Description = "Join Nairobi tech community for talks on AI, machine learning, and building scalable products in Africa."
        City = "Nairobi"
        Country = "Kenya"
        Location = "iHub, Kilimani"
        StartDate = "2026-05-15T18:00:00Z"
        EndDate = "2026-05-15T21:00:00Z"
        Price = 0
        ImageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
        InterestIds = @( (Get-InterestId "Startup Meetups"), (Get-InterestId "AI & Machine Learning"), (Get-InterestId "Web Development") )
    },
    @{
        Title = "Sunset Rooftop Jazz Night"
        Description = "Live jazz performances overlooking Nairobi skyline. Craft cocktails and small plates available."
        City = "Nairobi"
        Country = "Kenya"
        Location = "The Alchemist, Westlands"
        StartDate = "2026-05-17T19:00:00Z"
        EndDate = "2026-05-17T23:00:00Z"
        Price = 1500
        ImageUrl = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800"
        InterestIds = @( (Get-InterestId "Jazz & Blues"), (Get-InterestId "Rooftop Bars"), (Get-InterestId "Live Music") )
    },
    @{
        Title = "Street Food Festival: Taste of East Africa"
        Description = "Sample the best street food from Kenya, Tanzania, Uganda. Live cooking demos and cultural performances."
        City = "Nairobi"
        Country = "Kenya"
        Location = "Uhuru Gardens, Langata"
        StartDate = "2026-05-24T11:00:00Z"
        EndDate = "2026-05-24T20:00:00Z"
        Price = 500
        ImageUrl = "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800"
        InterestIds = @( (Get-InterestId "Street Food"), (Get-InterestId "Coffee Culture"), (Get-InterestId "Vegan Eats") )
    },
    @{
        Title = "Morning Yoga in Karura Forest"
        Description = "Guided yoga session surrounded by nature. All levels welcome. Bring your mat and water."
        City = "Nairobi"
        Country = "Kenya"
        Location = "Karura Forest, Main Entrance"
        StartDate = "2026-05-18T07:00:00Z"
        EndDate = "2026-05-18T08:30:00Z"
        Price = 800
        ImageUrl = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800"
        InterestIds = @( (Get-InterestId "Yoga"), (Get-InterestId "Meditation"), (Get-InterestId "Hiking") )
    },
    @{
        Title = "Contemporary Art Exhibition: New Voices"
        Description = "Discover emerging East African artists featuring painting, sculpture, photography, and digital art."
        City = "Nairobi"
        Country = "Kenya"
        Location = "GoDown Arts Centre, Industrial Area"
        StartDate = "2026-06-01T10:00:00Z"
        EndDate = "2026-06-01T18:00:00Z"
        Price = 300
        ImageUrl = "https://images.unsplash.com/photo-1518998053924-885ad971e856?w=800"
        InterestIds = @( (Get-InterestId "Contemporary Art"), (Get-InterestId "Photography Walks"), (Get-InterestId "Street Art") )
    },
    @{
        Title = "Cybersecurity Workshop: Protect Your Digital Life"
        Description = "Learn practical cybersecurity skills: password management, phishing detection, secure browsing."
        City = "Nairobi"
        Country = "Kenya"
        Location = "Nailab, Mombasa Road"
        StartDate = "2026-05-22T14:00:00Z"
        EndDate = "2026-05-22T17:00:00Z"
        Price = 2000
        ImageUrl = "https://images.unsplash.com/photo-1550751863-8847895f3c74?w=800"
        InterestIds = @( (Get-InterestId "Cybersecurity"), (Get-InterestId "Web Development"), (Get-InterestId "Startup Meetups") )
    },
    @{
        Title = "Comedy Night: Laugh Out Loud"
        Description = "East Africas funniest comedians take the stage for an unforgettable night of stand-up comedy."
        City = "Nairobi"
        Country = "Kenya"
        Location = "The Alchemist, Westlands"
        StartDate = "2026-05-31T20:00:00Z"
        EndDate = "2026-05-31T23:00:00Z"
        Price = 1200
        ImageUrl = "https://images.unsplash.com/photo-1584433037378-2e5e8d3f8f3e?w=800"
        InterestIds = @( (Get-InterestId "Comedy Clubs"), (Get-InterestId "Karaoke"), (Get-InterestId "Dance Parties") )
    },
    @{
        Title = "Weekend Hiking: Ngong Hills Adventure"
        Description = "Guided hike up Ngong Hills with breathtaking views of the Great Rift Valley. Transport included."
        City = "Nairobi"
        Country = "Kenya"
        Location = "Ngong Hills, Meet at Gate"
        StartDate = "2026-05-25T06:00:00Z"
        EndDate = "2026-05-25T14:00:00Z"
        Price = 2500
        ImageUrl = "https://images.unsplash.com/photo-1464822759085-2f9f9f3c8c5e?w=800"
        InterestIds = @( (Get-InterestId "Hiking"), (Get-InterestId "Cycling"), (Get-InterestId "Photography Walks") )
    },
    @{
        Title = "Wine and Cheese Tasting Evening"
        Description = "Explore South African and Kenyan wines paired with artisan cheeses. Expert sommelier guidance."
        City = "Nairobi"
        Country = "Kenya"
        Location = "The Wine Room, Karen"
        StartDate = "2026-06-07T18:30:00Z"
        EndDate = "2026-06-07T21:00:00Z"
        Price = 3500
        ImageUrl = "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800"
        InterestIds = @( (Get-InterestId "Wine Tasting"), (Get-InterestId "Coffee Culture"), (Get-InterestId "Rooftop Bars") )
    },
    @{
        Title = "Open Mic Night: Share Your Talent"
        Description = "Poetry, music, comedy, or storytelling - the stage is yours. Sign up at the door."
        City = "Nairobi"
        Country = "Kenya"
        Location = "Java House, Gigiri"
        StartDate = "2026-05-29T19:00:00Z"
        EndDate = "2026-05-29T22:00:00Z"
        Price = 0
        ImageUrl = "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800"
        InterestIds = @( (Get-InterestId "Open Mic Night"), (Get-InterestId "Live Music"), (Get-InterestId "Comedy Clubs") )
    }
)

# ==================== STEP 4: CREATE EVENTS ====================
Write-Host "Creating $($testEvents.Count) test events..." -ForegroundColor Yellow

foreach ($eventData in $testEvents) {
    try {
        $body = $eventData | ConvertTo-Json -Depth 10 -Compress
        
        $response = Invoke-RestMethod -Uri "$API_BASE/events" `
            -Method Post `
            -Headers @{ 
                Authorization = "Bearer $token"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        if ($response.isSuccess) {
            Write-Host "Created: $($eventData.Title)" -ForegroundColor Green
        } else {
            Write-Host "Failed: $($eventData.Title) - $($response.message)" -ForegroundColor Red
            $ERROR_COUNT++
        }
    }
    catch {
        Write-Host "Error creating '$($eventData.Title)': $($_.Exception.Message)" -ForegroundColor Red
        $ERROR_COUNT++
    }
    
    Start-Sleep -Milliseconds 200
}

# ==================== STEP 5: SUMMARY ====================
Write-Host ""
Write-Host "Seed Complete!" -ForegroundColor Cyan
Write-Host "Events created: $($testEvents.Count - $ERROR_COUNT)/$($testEvents.Count)" -ForegroundColor $(if($ERROR_COUNT -eq 0){"Green"}else{"Yellow"})
if ($ERROR_COUNT -gt 0) {
    Write-Host "Errors: $ERROR_COUNT" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test your API:" -ForegroundColor Cyan
Write-Host "GET $API_BASE/events?limit=5" -ForegroundColor White
Write-Host "GET $API_BASE/events/trending?limit=5" -ForegroundColor White

Write-Host ""
Write-Host "Done! Refresh your frontend to see the new events." -ForegroundColor Green
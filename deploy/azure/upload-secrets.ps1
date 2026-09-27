param(
  [string]$VaultName = "gcwashu26kv",
  [string]$EnvPath = ".env"
)

$ErrorActionPreference = "Stop"
$names = @{
  GEMINI_API_KEY = "gemini-api-key"
  SPECTRUM_PROJECT_ID = "spectrum-project-id"
  SPECTRUM_PROJECT_SECRET = "spectrum-project-secret"
  GITHUB_WRITE_TOKEN = "github-write-token"
  GITHUB_SCAN_TOKEN = "github-scan-token"
  GITHUB_CLIENT_ID = "github-client-id"
  GITHUB_CLIENT_SECRET = "github-client-secret"
}
$values = @{}
foreach ($line in [System.IO.File]::ReadAllLines((Resolve-Path -LiteralPath $EnvPath).Path)) {
  if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') {
    $values[$Matches[1]] = $Matches[2]
  }
}

foreach ($name in $names.Keys) {
  if (-not $values.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($values[$name])) {
    continue
  }
  & az keyvault secret set --vault-name $VaultName --name $names[$name] --value $values[$name] --output none --only-show-errors
  if ($LASTEXITCODE -ne 0) { throw "Could not upload $name to Key Vault." }
  Write-Output "Uploaded $name to Key Vault."
}

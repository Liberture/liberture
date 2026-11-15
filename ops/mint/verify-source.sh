#!/bin/sh
# Run in the extracted, patched NutMix source before building a release.
set -eu
grep -Fq 'srv.Addr = "127.0.0.1" + PORT' cmd/nutmix/main.go
grep -Eq 'Expiry[[:space:]]+int64[[:space:]]+`json:"-"`' internal/lightning/lnbits.go
grep -Fq 'req.Header.Set("Content-Type", "application/json")' internal/lightning/lnbits.go
grep -Fq 'cashu.ErrMintQuoteNoValidSignature' internal/mint/minting.go
for test in api/cashu/error_response_contract_test.go internal/lightning/proxy_contract_test.go internal/mint/quote_signature_error_test.go; do
  test -s "$test"
done
go test -p 4 ./api/cashu ./internal/lightning ./internal/mint -run 'Test(ErrorResponseContainsSDKRequiredDetail|InvoiceRequestMatchesRestrictedProxy|QuoteSignatureErrorAllowsWalletCompatibilityRetry)$' -count=1

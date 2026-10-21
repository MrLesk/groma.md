# Certificate trust fixtures

`compromised-cas.json` contains the public certificate variants from the
[eMudhra incident](https://github.com/galadran/we-have-a-problem.com), including
the affected intermediate keys and their root and cross-sign authentication paths.

`unsupported-key-ca.pem` is a self-signed Ed448 test CA. Bun 1.4.3 can parse its
certificate but cannot decode its public key. Trust filtering omits these unusable
keys and fails closed when no usable authorities remain. No fixture private key is needed.

`incident-server-emudhra.pem` and `incident-server-aaa.pem` contain the same
localhost leaf certificate and the two original intermediate certificate variants.
The leaf uses the existing test-only `registry-server-key.pem` public key and was
signed with the publicly compromised EM DV TLS CA - G3B key. It is valid from
2026-10-01 through 2027-10-01 for `localhost` and `127.0.0.1`. No intermediate
private key is stored here.

`scripts/check-native-tls.cjs` serves these fixtures on loopback and requires the
default .NET `HttpClient` to reject both TLS handshakes before any HTTP request.
The positive control checks normal NuGet HTTPS. The probe uses no certificate
validation callback, proxy for the loopback requests, or replacement .NET chain
policy.

`scripts/prepare-hosted-runner-trust.cjs` applies native trust mitigation before
SDK installation. The workflow runs `check-native-tls.cjs` after .NET setup and
before NuGet restore. Native trust mutation only runs in disposable GitHub-hosted
Windows and macOS jobs. Windows removes matching SPKI keys from Root/CA stores and imports the
known variants into Disallowed; macOS applies administrative deny settings with
bounded `security add-trusted-cert` calls. These follow
[Windows Disallowed precedence](https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/windows-vm-imds-certissues)
and Apple's [Security tool options](https://github.com/apple-oss-distributions/Security/blob/main/SecurityTool/macOS/security.c).

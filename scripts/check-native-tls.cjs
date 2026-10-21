const { execFile } = require('node:child_process')
const { once } = require('node:events')
const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises')
const https = require('node:https')
const os = require('node:os')
const path = require('node:path')
const { promisify } = require('node:util')

const execute = promisify(execFile)

/** Prove the native .NET TLS path rejects the actual incident chains without a proxy. */
async function checkNativeTls() {
  const fixture = path.resolve(__dirname, '../test/fixtures/certificate-trust')
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-dotnet-trust-'))
  const servers = []
  let requests = 0
  try {
    const key = await readFile(path.join(fixture, 'registry-server-key.pem'))
    const urls = []
    for (const name of ['incident-server-emudhra.pem', 'incident-server-aaa.pem']) {
      const cert = await readFile(path.join(fixture, name))
      const server = https.createServer({ key, cert }, (_request, response) => { requests++; response.end('unexpected authenticated request') })
      servers.push(server)
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      urls.push(`https://127.0.0.1:${server.address().port}`)
    }
    const project = path.join(temporary, 'TrustProbe.csproj')
    await writeFile(project, '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework></PropertyGroup></Project>')
    const config = path.join(temporary, 'NuGet.Config')
    await writeFile(config, '<configuration><packageSources><clear /></packageSources></configuration>')
    await writeFile(path.join(temporary, 'Program.cs'), `using System;
using System.Net.Http;
using System.Security.Authentication;
using System.Threading.Tasks;

foreach (string url in args)
{
    using var client = new HttpClient(new HttpClientHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(15) };
    try
    {
        await client.GetStringAsync(url);
        throw new Exception("A compromised certificate chain was accepted: " + url);
    }
    catch (HttpRequestException error) when (error.InnerException is AuthenticationException)
    {
        Console.WriteLine("Rejected incident chain through default native TLS: " + url);
    }
}
using var registry = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
using var response = await registry.GetAsync("https://api.nuget.org/v3/index.json", HttpCompletionOption.ResponseHeadersRead);
response.EnsureSuccessStatusCode();
Console.WriteLine("Normal NuGet HTTPS remains available.");
`)
    const options = { cwd: temporary, timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }
    await execute('dotnet', ['restore', project, '--configfile', config, '--nologo', '--verbosity', 'quiet'], options)
    await execute('dotnet', ['build', project, '--no-restore', '--nologo', '--verbosity', 'quiet'], options)
    const result = await execute('dotnet', [path.join(temporary, 'bin/Debug/net10.0/TrustProbe.dll'), ...urls], options)
    process.stdout.write(result.stdout)
    if (requests !== 0) throw new Error(`Incident HTTPS servers received ${requests} authenticated requests.`)
  } finally {
    for (const server of servers) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
    await rm(temporary, { recursive: true, force: true })
  }
}

module.exports = { checkNativeTls }
if (require.main === module) checkNativeTls().catch(error => { console.error(error); process.exitCode = 1 })

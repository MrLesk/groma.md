using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;

namespace Groma.CSharpScanner;

/// <summary>Explicit source calls only. Runtime receiver/value flow is deliberately unresolved.</summary>
internal sealed class OperationEvidence(string repositoryRoot)
{
    private readonly Dictionary<(string Id, string? WrittenName), ScanOperation> operations = new();
    private readonly List<PendingInvocation> invocations = [];

    public IEnumerable<ScanOperation> Operations => operations.Values;

    /// <summary>
    /// Every call into a repository operation; a call into a package or the framework reaches none. A file that several
    /// projects compile is analyzed once, by the first of them, and another project can parse it differently, for example
    /// under other constants. Where a call from that project binds, the analyzed file can then declare a member with
    /// another name, or none. So a call names its target only when the analyzed file holds the declaration the call
    /// binds to, by OperationId.Identity, and otherwise stays unresolved without a target.
    /// </summary>
    public IEnumerable<ScanInvocation> Invocations => invocations.Select(pending => operations.ContainsKey(pending.Target)
        ? new ScanInvocation(pending.Source, [pending.Target.Id], pending.Unresolved, pending.Line, pending.Member)
        : new ScanInvocation(pending.Source, [], Unresolved: true, pending.Line, pending.Member));

    /// <summary>Extracts this file's operations and calls, and returns the operation each node belongs to.</summary>
    public IReadOnlyDictionary<SyntaxNode, string> Extract(SyntaxNode root, SemanticModel model, string file, CancellationToken cancellationToken)
    {
        Dictionary<SyntaxNode, string> callers = new();
        foreach (SyntaxNode node in root.DescendantNodesAndSelf())
        {
            cancellationToken.ThrowIfCancellationRequested();
            string id = OperationId.Of(file, node);
            if (node is AnonymousFunctionExpressionSyntax lambda)
            {
                if (IsExpressionTree(lambda, model, cancellationToken)) continue;
                operations.TryAdd(OperationId.Identity(id, node), new ScanOperation(id, file, lambda is AnonymousMethodExpressionSyntax ? "anonymous method" : "lambda expression"));
                callers.Add(node, id);
                continue;
            }
            if (ExecutableMethod(node, model, cancellationToken) is not IMethodSymbol method) continue;
            operations.TryAdd(OperationId.Identity(id, node), ScanOperationOf(id, file, node, method, model, cancellationToken));
            callers.Add(node, id);
        }
        if (root is CompilationUnitSyntax unit && unit.Members.OfType<GlobalStatementSyntax>().Any())
        {
            string id = OperationId.Of(file, root);
            operations.TryAdd(OperationId.Identity(id, root), new ScanOperation(id, file, "<top-level>"));
            callers.Add(root, id);
        }
        foreach (SyntaxNode node in root.DescendantNodes().Where(IsExplicitCall))
        {
            cancellationToken.ThrowIfCancellationRequested();
            // A call with a type error binds to no certain target, so it is not reported.
            if (Caller(node, callers) is not string caller
                || model.GetDiagnostics(node.Span, cancellationToken).Any(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)) continue;
            (IMethodSymbol? target, bool unresolved) = Target(model.GetOperation(node, cancellationToken));
            // A target outside repository source, or declared without code, is an operation in no project.
            if (OperationId.DeclarationOf(repositoryRoot, target) is not (string id, SyntaxNode declaration) || !IsExecutable(declaration)) continue;
            invocations.Add(new PendingInvocation(Source: caller, Target: OperationId.Identity(id, declaration), Unresolved: unresolved,
                Line: node.GetLocation().GetLineSpan().StartLinePosition.Line + 1, Member: target!.Name));
        }
        return callers;
    }

    /// <summary>Named operations carry their source range and body tokens; lambdas and anonymous methods do not.</summary>
    private static ScanOperation ScanOperationOf(string id, string file, SyntaxNode node, IMethodSymbol method, SemanticModel model, CancellationToken cancellationToken)
    {
        string name = method.ToDisplayString(SymbolDisplayFormat.CSharpErrorMessageFormat);
        FileLinePositionSpan lines = node.GetLocation().GetLineSpan();
        return new ScanOperation(id, file, name, lines.StartLinePosition.Line + 1, lines.EndLinePosition.Line + 1, OperationTokens.Of(node, method, model, cancellationToken));
    }

    /// <summary>
    /// Whether a declaration holds code that runs: a method, constructor, operator or accessor with a body, an
    /// expression-bodied getter, or a local function. It reads syntax only, so it also answers for a call's target as
    /// the target's own project declares it, even when another project analyzed that file.
    /// </summary>
    private static bool IsExecutable(SyntaxNode node) => node switch
    {
        BaseMethodDeclarationSyntax declaration => declaration.Body is not null || declaration.ExpressionBody is not null,
        AccessorDeclarationSyntax accessor => accessor.Body is not null || accessor.ExpressionBody is not null,
        LocalFunctionStatementSyntax => true,
        ArrowExpressionClauseSyntax getter => getter.Parent is PropertyDeclarationSyntax or IndexerDeclarationSyntax,
        _ => false,
    };

    /// <summary>The method an executable declaration declares; an expression-bodied getter belongs to its property or indexer.</summary>
    private static IMethodSymbol? ExecutableMethod(SyntaxNode node, SemanticModel model, CancellationToken token) =>
        !IsExecutable(node) ? null
        : node is ArrowExpressionClauseSyntax getter ? (model.GetDeclaredSymbol(getter.Parent!, token) as IPropertySymbol)?.GetMethod
        : model.GetDeclaredSymbol(node, token) as IMethodSymbol;

    /// <summary>
    /// A lambda converted to Expression&lt;T&gt; is data, not code that runs. As an argument it is one only when the call binds
    /// to a parameter of that type: when binding fails, Roslyn's recovery guesses a candidate differently from run to run.
    /// </summary>
    private static bool IsExpressionTree(AnonymousFunctionExpressionSyntax lambda, SemanticModel model, CancellationToken token)
    {
        INamedTypeSymbol? expression = model.Compilation.GetTypeByMetadataName("System.Linq.Expressions.Expression`1");
        if (expression is null) return false;
        if (lambda.Parent is ArgumentSyntax { Parent.Parent: ExpressionSyntax call } argument)
        {
            IArgumentOperation? bound = (model.GetOperation(call, token) switch
            {
                IInvocationOperation invocation => invocation.Arguments,
                IObjectCreationOperation creation => creation.Arguments,
                _ => [],
            }).FirstOrDefault(candidate => candidate.Syntax == argument);
            return SymbolEqualityComparer.Default.Equals(bound?.Parameter?.Type.OriginalDefinition, expression);
        }
        return SymbolEqualityComparer.Default.Equals(model.GetTypeInfo(lambda, token).ConvertedType?.OriginalDefinition, expression);
    }

    private static bool IsExplicitCall(SyntaxNode node) =>
        node is InvocationExpressionSyntax or BaseObjectCreationExpressionSyntax or ConstructorInitializerSyntax;

    /// <summary>The operation whose code contains this node; an initializer outside any operation has none.</summary>
    internal static string? Caller(SyntaxNode node, IReadOnlyDictionary<SyntaxNode, string> callers)
    {
        foreach (SyntaxNode ancestor in node.Ancestors())
        {
            if (callers.TryGetValue(ancestor, out string? caller)) return caller;
            // Do not attribute field/property initializers to a top-level entry point.
            if (ancestor is AnonymousFunctionExpressionSyntax or LocalFunctionStatementSyntax || ancestor is MemberDeclarationSyntax and not GlobalStatementSyntax) return null;
        }
        return null;
    }

    /// <summary>
    /// The method a call reaches. Interface and overridable targets stay unresolved, because the runtime may pick another
    /// implementation.
    /// </summary>
    private static (IMethodSymbol? Target, bool Unresolved) Target(IOperation? operation) => operation switch
    {
        IInvocationOperation invocation => (invocation.TargetMethod, invocation.TargetMethod.ContainingType.TypeKind == TypeKind.Interface
            || (invocation.IsVirtual && !invocation.TargetMethod.IsSealed && !invocation.TargetMethod.ContainingType.IsSealed)),
        IObjectCreationOperation creation => (creation.Constructor, false),
        _ => (null, true),
    };

    /// <summary>The name a call or member access uses, or null when the expression names nothing.</summary>
    internal static string? CallName(ExpressionSyntax expression) => expression switch
    {
        MemberAccessExpressionSyntax access => access.Name.Identifier.ValueText,
        MemberBindingExpressionSyntax binding => binding.Name.Identifier.ValueText,
        SimpleNameSyntax name => name.Identifier.ValueText,
        _ => null,
    };

    private sealed record PendingInvocation(string Source, (string Id, string? WrittenName) Target, bool Unresolved, int Line, string Member);
}

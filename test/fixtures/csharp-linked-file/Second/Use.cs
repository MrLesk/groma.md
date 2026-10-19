namespace Second;

public static class Use
{
    public static int Run() => Shared.Linked.Same(new List<int>()) + Shared.Linked.Flagged() + Shared.Linked.Extra();
}

# 🔥 Physical offsets include this non-BMP character.
from services import Store

trait Writable:
    def write(self, value: Int): ...
    def describe(self):
        return render(self)

@fieldwise_init
struct Service[T: Writable]:
    var store: T

    def __init__(out self, var store: T):
        self.store = store^

    @staticmethod
    def create():
        return Service[Store]()

    def _run(self, value: Int = default_value()):
        self.store.write(value)
        @wrapper(make_decorator())
        def nested():
            nested_work()
        var delayed = lambda: later()
        schedule(delayed)
        comptime count = compile_count()
        comptime if enabled():
            compile_branch()
        return finish(value)

    struct Nested:
        def hidden(self):
            inside_nested_type()

comptime Alias = Service[Store]

def transform[T: Writable](value: T):
    value.write(1)

def `quoted name`():
    print("hello")

def _helper():
    pass

def main():
    var service = Service[Store]()
    service._run(1)
    transform[Store](service.store)

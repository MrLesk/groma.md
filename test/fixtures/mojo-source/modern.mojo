from provider import (`where` as select, `1j`)

def message(value: Int) -> String:
    return (
        "first "
        "second {}".format(value)
    )

struct Reader:
    def read[](self) -> Int:
        return 1

    @staticmethod
    def from[T: AnyType]() -> Self:
        return Self()

def choose(value: Optional[Int]):
    if case .Some(result) = value:
        print(result)

def capturing_callback(value: Int) capturing -> Int:
    return value

comptime Callback = def(Int) capturing -> Int

def checked[value: Int]() where value > 0 else "must be positive":
    print(value)

def config() -> Int:
    return 2

def consume[size: Int](value: Int):
    print(value)

def parameter_caller():
    consume[config()](argument())
    consume_pair[config(), config()](argument())
    __mlir_op.`pop.fence`[
        ordering=ordering.__mlir_attr(),
        syncscope=_get_kgen_string[scope](),
        _type=None,
    ]()
    var indexed = items[index()]
    make_items()[another_index()] = indexed

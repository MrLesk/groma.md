// swift-tools-version: 5.9
import PackageDescription

// SwiftSyntax 604.0.0. Windows installers omit the parser development modules.
let package = Package(
    name: "GromaSwiftScanner",
    dependencies: [
        .package(url: "https://github.com/swiftlang/swift-syntax.git",
                 revision: "050f1a346fbbac0ca2cfb15a95274f7bd1cf0ccf")
    ],
    targets: [
        .executableTarget(
            name: "groma-swift-scanner",
            dependencies: [
                .product(name: "SwiftParser", package: "swift-syntax"),
                .product(name: "SwiftParserDiagnostics", package: "swift-syntax"),
                .product(name: "SwiftSyntax", package: "swift-syntax")
            ],
            path: "worker"
        )
    ]
)

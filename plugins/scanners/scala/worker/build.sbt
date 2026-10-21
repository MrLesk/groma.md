ThisBuild / scalaVersion := "3.10.0"
ThisBuild / organization := "md.groma"
ThisBuild / version := "0.1.0"

lazy val root = (project in file("."))
  .settings(
    name := "groma-scala-scanner-worker",
    libraryDependencies += "org.scalameta" %% "scalameta" % "4.17.4",
    assembly / mainClass := Some("md.groma.scanner.Main"),
    assembly / assemblyOutputPath := baseDirectory.value / "worker.jar",
  )

# IOTA-C0
Compiler, emulator, documentation, example programs, and debugger for the IOTA-C0 processor

## Compiler
The compiler can be found at `src/compiler/ic0c`. It is writen in Pyhton 2.
```
Usage: ic0c [OPTION]... [FILE]
Compiles a program for the IOTA-C0

  -o <file>    write the compiled program to <file>
  -s <form>    input file is in <form>
  -e <form>    compile into <form>
  -h           display this help and exit

<form> can be the id or name of any of these forms:
  |id   |name    |file extension
  |-----+--------+--------------
  |0    |preasm  |.pre.asm      
  |1    |asm     |.asm          
  |2    |prenum  |.pre.csv      
  |3    |num     |.csv          
  |4    |mem     |.c0       
```

## Emulator
The emulator can be found at `src/runtime/`. It is written in ANSI C. A makefile is provided.
```
Usage: ic0 [OPTION]... [FILE]
Runs an IOTA-C0 file forward a given number of cycles

  -o <file>    use <file> to output the end state
  -s <arg>     run <arg> cycles
  -h           display this help and exit

If an output file is not specified using -o, the input file will be used.
If a number of cycles is not specified using -s, 65535 cycles will be run.
```

## Documentation
Documentation for the processor can be found at `docs/processor.html`, and documentation for the assembly language can be found at `assembly.html`. Just open the files with a web browser.

## Example Programs
There are three folders in `examples/`, each contains a `.pre.asm` file. Test out the compiler and runtime on these files.

## Debugger
A debugger can be found at `/debugger/index.html`. Visit this page in a browser to run it. To use it, paste preassembly code into the first text area and click compile, then click run.

There is an overview of the RAM on the top left of the page, and a list a variables declaced with `.var` on the right.

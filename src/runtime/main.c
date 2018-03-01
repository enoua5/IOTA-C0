/*
  Why did I write this is ANSI C?
  I don't even know C...
*/
#include <stdlib.h>
#include <stdio.h>
#include <string.h> /* strcmp() */
#include <getopt.h> /* getopt() */
#include <ctype.h> /* isprint() */

#include "globals.h"

void showHelp(char* programName)
{
  printf("Usage: %s [OPTION]... [FILE]\n", programName);
  printf("Runs an IOTA-C0 file forward a given number of cycles\n");
  printf("\n");
  printf("  -o <file>    use <file> to output the end state\n");
  printf("  -s <arg>     run <arg> cycles\n");
  printf("  -h           display this help and exit\n");
  printf("\n");
  printf("If an output file is not specified using -o, the input file will be used.\n");
  printf("If a number of cycles is not specified using -s, 65535 cycles will be run.\n");
}

int main(int argc, char** argv)
{
  char* inFileName;
  char* outFileName;
  int steps=0xFFFF;
  
  char hasOutFile=0;
  
  int opt;
  
  while((opt=getopt(argc, argv, "s:o:h")) != -1)
  {
    switch(opt)
    {
      case 's':
        sscanf(optarg, "%d", &steps);
        break;
      case 'o':
        outFileName=optarg;
        hasOutFile=1;
        break;
      case '?':
        if(optopt=='s' || optopt=='o')
          fprintf(stderr, "Option -%c requires an argument.\n", optopt);
        else if (isprint(optopt))
          fprintf(stderr, "Unknown option `-%c'.\n", optopt);
        else
          fprintf (stderr, "Unknown option character `\\x%x'.\n", optopt);
        return 1;
      case 'h':
      default:
        showHelp(argv[0]);
        return 0;
    }
  }
  if(optind!=argc-1)
  {
    showHelp(argv[0]);
    return -1;
  }
  inFileName=argv[optind];
  if(!hasOutFile)
    outFileName=inFileName;
  
  FILE* inputFile=fopen(inFileName, "rb");
  fread(mem, 16, MEM_LENGTH, inputFile);
  fclose(inputFile);
  
  int i;
  /*
    If we're on a little endian system,
    we gotta flip the bytes the right way
  */
  if(!IS_BIG_ENDIAN)
    for(i=0; i<MEM_LENGTH; i++)
      mem[i]=((mem[i]>>8)+(mem[i]<<8));
  
  run(steps);
  
  /* And back again */
  if(!IS_BIG_ENDIAN)
    for(i=0; i<MEM_LENGTH; i++)
      mem[i]=((mem[i]>>8)+(mem[i]<<8));
  
  FILE* outputFile=fopen(outFileName, "wb");
  fwrite(mem, 16, MEM_LENGTH, outputFile);
  fclose(outputFile);
  
  return 0;
}

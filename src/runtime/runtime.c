#include "globals.h"
#include "runtime.h"

void runCRAM()
{
  /* reset switch */
  if(mem[0x807F])
  {
    uint16_t i;
    for(i=0; i<MEM_LENGTH; i++)
      mem[i]=0;
  }
  /* literals */
  uint16_t p;
  for(p=0; p<0x8000; p++)
    mem[p]=p;
  /* deref */
  mem[0x8001]|=0x8000;
  mem[mem[0x8001]]=mem[0x8002];
  /* ternaries */
  mem[0x8004]|=0x8000;
  mem[0x8005]|=0x8000;
  mem[0x8006]=mem[0x8003]?mem[0x8004]:mem[0x8005];
  mem[0x800A]=mem[0x8007]?mem[0x8008]:mem[0x8009];
  /* bitwises */
  mem[0x800D]=mem[0x800B]&mem[0x800C];
  mem[0x8010]=mem[0x800E]|mem[0x800F];
  mem[0x8013]=mem[0x8011]^mem[0x8012];
  mem[0x8015]=~mem[0x8014];
  /* comparisons */
  mem[0x8018]=mem[0x8016]<mem[0x8017]?0xFFFF:0x0000;
  mem[0x801B]=mem[0x8019]<=mem[0x801A]?0xFFFF:0x0000;
  mem[0x801E]=mem[0x801C]>mem[0x801D]?0xFFFF:0x0000;
  mem[0x8021]=mem[0x801F]>=mem[0x8020]?0xFFFF:0x0000;
  mem[0x8024]=mem[0x8022]==mem[0x8023]?0xFFFF:0x0000;
  mem[0x8027]=mem[0x8025]!=mem[0x8026]?0xFFFF:0x0000;
  /* bitshifts */
  mem[0x802A]=~mem[0x8028]>>mem[0x8029];
  mem[0x802D]=mem[0x802B]>>mem[0x802C];
  mem[0x8030]=mem[0x802E]<<mem[0x802F];
  /* math */
  mem[0x8033]=mem[0x8031]+mem[0x8032];
  mem[0x8036]=mem[0x8034]-mem[0x8035];
  mem[0x8039]=mem[0x8037]*mem[0x8038];
  mem[0x803C]=mem[0x803B]==0?0:mem[0x803A]/mem[0x803B];
  mem[0x803F]=mem[0x803E]==0?0:mem[0x803D]%mem[0x803E];
  /* math with set 2nd opps */
  mem[0x8041]=mem[0x8040]+1;
  mem[0x8043]=mem[0x8042]-1;
  mem[0x8045]=mem[0x8044]*-1;
  mem[0x8046]|=0x8000;
  /* stacks */
  if(mem[0x8048]) 
  {
    /* push to stack A */
    if(lengthA<64)
      stackA[lengthA++]=mem[0x8047];
    mem[0x8048]=0x0000;
  }
  if(mem[0x804A])
  {
    /* pop from stack A */
    uint16_t popped=0x0000;
    if(lengthA>0)
    {
      popped=stackA[--lengthA];
      stackA[lengthA]=0;
    }
    mem[0x8049]=popped;
    mem[0x804A]=0x0000;
  }
  if(mem[0x804C])
  {
    /* push to stack B */
    if(lengthB<64)
      stackB[lengthB++]=mem[0x804B]|0x8000;
    mem[0x804C]=0x0000;
  }
  if(mem[0x804E])
  {
    /* pop from stack B */
    uint16_t popped=0x0000;
    if(lengthB>0)
    {
      popped=stackB[--lengthB];
      stackB[lengthB]=0;
    }
    mem[0x804D]=popped;
    mem[0x804E]=0x0000;
  }
  {
    uint16_t ap=0;
    for(; ap<lengthA; ap++)
      mem[ap+0x8080]=stackA[ap];
    for(; ap<64; ap++)
      mem[ap+0x8080]=0x0000;
  }
  {
    uint16_t bp=0;
    for(; bp<lengthB; bp++)
      mem[bp+0x80C0]=stackB[bp];
    for(; bp<64; bp++)
      mem[bp+0x80C0]=0x0000;
  }
  
  /* misc block */
  mem[0x804F]=rand()%0x10000;
  mem[0x8051]=mem[mem[0x8050]];
  
  /* clear unassigned section */
  for(p=0x8052; p<=0x807E; p++)
    mem[p]=0x0000;
}
void step()
{
  reg[0]=mem[0x8000];
  reg[0]=mem[reg[0]];
  mem[0x8000]++;
  
  reg[1]=mem[0x8000];
  reg[1]=mem[reg[1]];
  mem[0x8000]++;
  
  mem[reg[0]]=mem[reg[1]];
  
  runCRAM();
}

void run(int steps)
{
  srand(time(NULL));
  int i;
  for(i=0; i<steps; i++)
    step();
}

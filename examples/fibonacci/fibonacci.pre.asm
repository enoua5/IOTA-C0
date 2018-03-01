#uses only draft 2, which added more instructions
#initial state
MOV 0x200 1
MOV 0x201 1
#locations of the most recent numbers
ADR 0x200 0x1FE
ADR 0x201 0x1FF
#location of the next number
STA 0x202
#start the loop
LBL 0x1FB
  #add the two numbers together
  GET 0x1FE 0x1FC
  GET 0x1FF 0x1FD
  ADD *0x1FC *0x1FD
  #write the sum to the referenced address
  STV *0x33
  #increment the pointers
  INC *0x1FE 0x1FE
  INC *0x1FF 0x1FF
  #the address of DFA
  INC *0x1 0x1
  #jump to the start of the loop
QJP 0x1FB

class IOTA_C0
{
  constructor(program=[])//program is an array of ints
  {
    //Init mem
    this.mem=new Array(0x10000).fill(0);
    this.reg=new Array(2).fill(0);
    this.STACKS={
      A: [],
      B: []
    };
    //ip
    this.mem[0x8000]=0x8100;
    //pointer
    this.mem[0x8001]=0x807F;
    
    //load program into RAM
    let p=0x8100;
    for(let i=0; i<program.length; i++)
      this.mem[i+p]=program[i];
    
    //make sure everything is in range
    this.mem=this.mem.map((n)=>this.constructor.mod(n));
    
    this.runCRAM();
  }
  static mod(n, m=0x10000)
  {
    return ((n%m)+m)%m;
  }
  
  runCRAM()
  {
    if(this.mem[0x807F])//reset switch
      this.mem=this.mem.map(()=>0);
    //literals
    for(let p=0; p<0x8000; p++)
      this.mem[p]=p;
    //deref
    this.mem[0x8001]|=0x8000;
    this.mem[this.mem[0x8001]]=this.mem[0x8002];
    //ternaries
    this.mem[0x8004]|=0x8000;
    this.mem[0x8005]|=0x8000;
    this.mem[0x8006]=this.mem[0x8003]?this.mem[0x8004]:this.mem[0x8005];
    this.mem[0x800A]=this.mem[0x8007]?this.mem[0x8008]:this.mem[0x8009];
    //bitwises
    this.mem[0x800D]=this.mem[0x800B]&this.mem[0x800C];
    this.mem[0x8010]=this.mem[0x800E]|this.mem[0x800F];
    this.mem[0x8013]=this.mem[0x8011]^this.mem[0x8012];
    this.mem[0x8015]=~this.mem[0x8014];
    //comparisons
    this.mem[0x8018]=this.mem[0x8016]<this.mem[0x8017]?0xFFFF:0x0000;
    this.mem[0x801B]=this.mem[0x8019]<=this.mem[0x801A]?0xFFFF:0x0000;
    this.mem[0x801E]=this.mem[0x801C]>this.mem[0x801D]?0xFFFF:0x0000;
    this.mem[0x8021]=this.mem[0x801F]>=this.mem[0x8020]?0xFFFF:0x0000;
    this.mem[0x8024]=this.mem[0x8022]==this.mem[0x8023]?0xFFFF:0x0000;
    this.mem[0x8027]=this.mem[0x8025]!=this.mem[0x8026]?0xFFFF:0x0000;
    //bitshifts
    this.mem[0x802A]=this.mem[0x8028]>>>this.mem[0x8029];
    
    {
      //can't use >>; wrong bittage
      let bits=this.mem[0x802B].toString(2).padStart(16, '0');
      let msd=bits[0];
      bits=bits.substr(0, 16-this.mem[0x802C]);
      bits=bits.padStart(16, msd);
      this.mem[0x802D]=parseInt(bits, 2);
    }
    this.mem[0x8030]=this.mem[0x802E]<<this.mem[0x802F];
    //math
    this.mem[0x8033]=this.mem[0x8031]+this.mem[0x8032];
    this.mem[0x8036]=this.mem[0x8034]-this.mem[0x8035];
    this.mem[0x8039]=this.mem[0x8037]*this.mem[0x8038];
    this.mem[0x803C]=this.mem[0x803B]==0?0:this.mem[0x803A]/this.mem[0x803B];
    this.mem[0x803F]=this.mem[0x803E]==0?0:this.mem[0x803D]%this.mem[0x803E];
    //math with set 2nd opps
    this.mem[0x8041]=this.mem[0x8040]+1;
    this.mem[0x8043]=this.mem[0x8042]-1;
    this.mem[0x8045]=this.mem[0x8044]*-1;
    this.mem[0x8046]|=0x8000;
    //stacks
    if(this.mem[0x8048]) //push to stack A
    {
      if(this.STACKS.A.length<64)
        this.STACKS.A.push(this.mem[0x8047]);
      this.mem[0x8048]=0x0000;
    }
    if(this.mem[0x804A]) //pop from stack A
    {
      let popped=0x0000;
      if(this.STACKS.A.length>0)
        popped=this.STACKS.A.pop();
      this.mem[0x8049]=popped;
      this.mem[0x804A]=0x0000;
    }
    if(this.mem[0x804C]) //push to stack B
    {
      if(this.STACKS.B.length<64)
        this.STACKS.B.push(this.mem[0x804B]|0x8000);
      this.mem[0x804C]=0x0000;
    }
    if(this.mem[0x804E]) //pop from stack B
    {
      let popped=0x0000;
      if(this.STACKS.B.length>0)
        popped=this.STACKS.B.pop();
      this.mem[0x804D]=popped;
      this.mem[0x804E]=0x0000;
    }
    {
      let ap=0;
      for(; ap<this.STACKS.A.length; ap++)
        this.mem[ap+0x8080]=this.STACKS.A[ap];
      for(; ap<64; ap++)
        this.mem[ap+0x8080]=0x0000;
    }
    {
      let bp=0;
      for(; bp<this.STACKS.B.length; bp++)
        this.mem[bp+0x80C0]=this.STACKS.B[bp];
      for(; bp<64; bp++)
        this.mem[bp+0x80C0]=0x0000;
    }
    
    //misc block
    this.mem[0x804F]=Math.floor(Math.random()*(2**16));
    this.mem[0x8051]=this.mem[this.mem[0x8050]];
    
    //clear unassigned section
    for(let p=0x8052; p<=0x807E; p++)
      this.mem[p]=0x0000;
      
    //wrap-around
    this.mem=this.mem.map((n)=>this.constructor.mod(n));
  }
  step()
  {
    this.reg[0]=this.mem[0x8000];
    this.reg[0]=this.mem[this.reg[0]];
    this.mem[0x8000]++;
    this.reg[1]=this.mem[0x8000];
    this.reg[1]=this.mem[this.reg[1]];
    this.mem[0x8000]++;
    this.mem[this.reg[0]]=this.mem[this.reg[1]];
    
    this.runCRAM();
  }
  
  get RAMImage()
  {
    const SCALE=2;
    let c=document.createElement("canvas");
    c.width=256*SCALE;
    c.height=256*SCALE;
    let ctx=c.getContext('2d');
    for(let p=0; p<0x10000; p++)
    {
      let byte=this.mem[p];
      
      let x=p%0x100;
      let y=Math.floor(p/0x100);
      let color='#'+byte.toString(16).padStart(4, '0');
      ctx.fillStyle=color;
      ctx.fillRect(x*SCALE, y*SCALE, SCALE, SCALE);
    }
    return c;
  }
}

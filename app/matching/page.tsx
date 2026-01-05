import Image from "next/image";

export default function MatchingPage() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-b from-[#FFFFFF] to-[#ECEDFF]">
      <div className="flex flex-col items-center gap-4">
        <Image 
          src="/images/fix.jpeg" 
          alt="반 매칭 페이지" 
          width={400} 
          height={400}
          className="rounded-lg"
        />
        <h1 className="text-3xl font-semibold">공사중입니다 ⚒️</h1>
      </div>
    </div>
  );
}


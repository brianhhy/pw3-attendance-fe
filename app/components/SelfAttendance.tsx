"use client";

import useTeacherStore from "@/app/(shared)/(store)/teacherStore";
import { useEffect } from "react";

export default function SelfAttendance() {

    const { teachers, getTeachers } = useTeacherStore();
    useEffect(() => {
        getTeachers();
    }, []);
    console.log(teachers);
    return(
        <div className="flex flex-col justify-center items-center text-center gap-4">
            <div className="flex flex-col max-w-[500px] max-h-[700px] p-10 gap-10 rounded-[15px] border-[1px] border-[#D7E2ED] bg-[#ffffff]">
            <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-[40px] font-bold text-black">강유</span>
                <span className="text-[30px] font-medium text-[#697077]">중학교 1학년 1반</span>
            </div>
            <div className="w-[400px] h-[400px] bg-transparent rounded-[50%] border-[1px] border-[#D7E2ED]"></div>
                <button className="w-[400px] h-[60px] bg-linear-to-r from-[#A8FF78] to-[#78FFD6] text-[#0AB81E] font-bold text-[30px] rounded-[10px] ">출석 체크하기</button>
            </div>
        </div>
    )
}
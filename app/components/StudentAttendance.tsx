"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import useAttendanceStore from "../(shared)/(store)/attendanceStore";
import { markStudentAttendance, getStudentAttendances } from "../(shared)/(api)/attendance";
import { getStudentClassesByYear } from "../(shared)/(api)/student";
import Alert from "../(shared)/(modal)/Alert";

interface ClassData {
  id?: number;
  schoolType: string;
  grade: number;
  classNumber: number;
  className: string;
  teacherName: string;
  students: Array<{
    id: number;
    name: string;
    studentClassId?: number;
    status?: "attended" | "late" | "absent";
  }>;
}

const getSchoolTypeName = (schoolType: string): string => {
  switch (schoolType) {
    case "MIDDLE":
      return "중학교";
    case "HIGH":
      return "고등학교";
    case "ELEMENTARY":
      return "초등학교";
    default:
      return "학교";
  }
};

export default function StudentAttendance() {
  const { selectedDate, getAttendances, classAttendanceData } = useAttendanceStore();
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setIsLoading(true);
        const classResponse = await getStudentClassesByYear(2026);
        const schoolYear = 2026;
        const attendanceResponse = await getStudentAttendances(schoolYear, selectedDate);
        
        const attendanceMap: { [key: number]: { [key: number]: string } } = {};
        if (Array.isArray(attendanceResponse)) {
          attendanceResponse.forEach((classItem: any) => {
            const classRoomId = classItem.classRoomId || classItem.class_room_id;
            if (classRoomId && classItem.students) {
              attendanceMap[classRoomId] = {};
              classItem.students.forEach((student: any) => {
                const studentClassId = student.studentClassId || student.student_class_id;
                const status = student.status;
                if (studentClassId && status) {
                  attendanceMap[classRoomId][studentClassId] = status;
                }
              });
            }
          });
        }
        
        const transformedData: ClassData[] = classResponse.map((classItem: any) => {
          const classRoomId = classItem.classRoomId;
          const classAttendance = attendanceMap[classRoomId] || {};
          
          const studentsWithStatus = classItem.students?.map((student: any) => {
            const studentClassId = student.id;
            const status = classAttendance[studentClassId];
            
            let mappedStatus: "attended" | "late" | "absent" | undefined;
            if (status) {
              const statusUpper = String(status).toUpperCase();
              if (statusUpper === "ATTEND") {
                mappedStatus = "attended";
              } else if (statusUpper === "LATE") {
                mappedStatus = "late";
              } else if (statusUpper === "ABSENT") {
                mappedStatus = "absent";
              }
            }
            
            return {
              id: student.studentId,
              name: student.studentName,
              studentClassId: student.id,
              status: mappedStatus,
            };
          }) || [];

          return {
            id: classItem.classRoomId,
            schoolType: classItem.schoolType,
            grade: classItem.grade,
            classNumber: classItem.classNumber,
            className: classItem.className || `${classItem.grade}학년 ${classItem.classNumber}반`,
            teacherName: classItem.teacherName || "담임 미지정",
            students: studentsWithStatus,
          };
        });

        const sortedClasses = transformedData.sort((a, b) => {
          const getSchoolTypePriority = (schoolType: string): number => {
            if (schoolType === "MIDDLE") return 1;
            if (schoolType === "ELEMENTARY") return 2;
            if (schoolType === "HIGH") return 3;
            return 4;
          };
          
          const priorityA = getSchoolTypePriority(a.schoolType);
          const priorityB = getSchoolTypePriority(b.schoolType);
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          if (a.grade !== b.grade) {
            return a.grade - b.grade;
          }
          
          return a.classNumber - b.classNumber;
        });

        setClassData(sortedClasses);
      } catch (error) {
        console.error("반별 학생 정보 조회 실패:", error);
        setClassData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
    getAttendances();
  }, [selectedDate]);

  const filteredClassData = useMemo(() => {
    if (!searchQuery.trim()) {
      return classData;
    }

    const query = searchQuery.toLowerCase();
    return classData
      .map((classItem) => {
        const filteredStudents = classItem.students.filter((student) =>
          student.name.toLowerCase().includes(query)
        );

        if (filteredStudents.length === 0) {
          return null;
        }

        return {
          ...classItem,
          students: filteredStudents,
        };
      })
      .filter((classItem): classItem is ClassData => classItem !== null);
  }, [classData, searchQuery]);

  const handleAttendanceClick = async (studentId: number, studentClassId: number) => {
    const currentHour = new Date().getHours();
    const attendanceStatus = currentHour < 9 ? "ATTEND" : "LATE";
    
    const mappedStatus: "attended" | "late" = attendanceStatus === "ATTEND" ? "attended" : "late";
    setClassData(prevData => 
      prevData.map(classItem => ({
        ...classItem,
        students: classItem.students.map(student => 
          student.id === studentId && student.studentClassId === studentClassId
            ? { ...student, status: mappedStatus }
            : student
        )
      }))
    );
    
    try {
      await markStudentAttendance(studentClassId, selectedDate, attendanceStatus);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const schoolYear = 2026;
      const attendanceResponse = await getStudentAttendances(schoolYear, selectedDate);
      
      const attendanceMap: { [key: number]: { [key: number]: string } } = {};
      if (Array.isArray(attendanceResponse)) {
        attendanceResponse.forEach((classItem: any) => {
          const classRoomId = classItem.classRoomId || classItem.class_room_id;
          if (classRoomId && classItem.students) {
            attendanceMap[classRoomId] = {};
            classItem.students.forEach((student: any) => {
              const studentClassId = student.studentClassId || student.student_class_id;
              const status = student.status;
              if (studentClassId && status) {
                attendanceMap[classRoomId][studentClassId] = status;
              }
            });
          }
        });
      }
      
      setClassData(prevData => 
        prevData.map(classItem => {
          const classRoomId = classItem.id;
          const classAttendance = attendanceMap[classRoomId || 0] || {};
          
          return {
            ...classItem,
            students: classItem.students.map(student => {
              const currentStudentClassId = student.studentClassId;
              const isUpdatingStudent = student.id === studentId && currentStudentClassId === studentClassId;
              const status = currentStudentClassId ? classAttendance[currentStudentClassId] : null;
              
              let mappedStatus: "attended" | "late" | "absent" | undefined = student.status;
              
              if (status) {
                const statusUpper = String(status).toUpperCase();
                if (statusUpper === "ATTEND") {
                  mappedStatus = "attended";
                } else if (statusUpper === "LATE") {
                  mappedStatus = "late";
                } else if (statusUpper === "ABSENT") {
                  mappedStatus = "absent";
                }
              }
              
              if (isUpdatingStudent && !status && student.status) {
                mappedStatus = student.status;
              }
              
              return {
                ...student,
                status: mappedStatus,
              };
            })
          };
        })
      );
      
      await getAttendances();
      
      setAlertType("success");
      setAlertMessage("출석 체크가 완료되었습니다.");
      setAlertOpen(true);
    } catch (error: any) {
      console.error("출석 체크 실패:", error);
      
      const schoolYear = 2026;
      const attendanceResponse = await getStudentAttendances(schoolYear, selectedDate);
      
      const attendanceMap: { [key: number]: { [key: number]: string } } = {};
      if (Array.isArray(attendanceResponse)) {
        attendanceResponse.forEach((classItem: any) => {
          const classRoomId = classItem.classRoomId || classItem.class_room_id;
          if (classRoomId && classItem.students) {
            attendanceMap[classRoomId] = {};
            classItem.students.forEach((student: any) => {
              const studentClassId = student.studentClassId || student.student_class_id;
              const status = student.status;
              if (studentClassId && status) {
                attendanceMap[classRoomId][studentClassId] = status;
              }
            });
          }
        });
      }
      
      setClassData(prevData => 
        prevData.map(classItem => {
          const classRoomId = classItem.id;
          const classAttendance = attendanceMap[classRoomId || 0] || {};
          
          return {
            ...classItem,
            students: classItem.students.map(student => {
              const studentClassId = student.studentClassId;
              const status = studentClassId ? classAttendance[studentClassId] : null;
              
              let mappedStatus: "attended" | "late" | "absent" | undefined;
              if (status) {
                const statusUpper = String(status).toUpperCase();
                if (statusUpper === "ATTEND") {
                  mappedStatus = "attended";
                } else if (statusUpper === "LATE") {
                  mappedStatus = "late";
                } else if (statusUpper === "ABSENT") {
                  mappedStatus = "absent";
                }
              }
              
              return {
                ...student,
                status: mappedStatus,
              };
            })
          };
        })
      );
      
      let errorMessage = "출석 체크 중 오류가 발생했습니다.";
      if (error.response?.status === 400) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error || "잘못된 요청입니다.";
        errorMessage = `잘못된 요청입니다: ${serverMessage}`;
      } else if (error.response?.status === 500) {
        errorMessage = "서버 오류가 발생했습니다. 날짜가 올바른지 확인해주세요.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertType("error");
      setAlertMessage(errorMessage);
      setAlertOpen(true);
    }
  };

  const handleAbsenceClick = async (studentId: number, studentClassId: number) => {
    try {
      await markStudentAttendance(studentClassId, selectedDate, "ABSENT");
      await getAttendances();
      
      const schoolYear = 2026;
      const attendanceResponse = await getStudentAttendances(schoolYear, selectedDate);
      
      const attendanceMap: { [key: number]: { [key: number]: string } } = {};
      if (Array.isArray(attendanceResponse)) {
        attendanceResponse.forEach((classItem: any) => {
          const classRoomId = classItem.classRoomId || classItem.class_room_id;
          if (classRoomId && classItem.students) {
            attendanceMap[classRoomId] = {};
            classItem.students.forEach((student: any) => {
              const studentClassId = student.studentClassId || student.student_class_id;
              const status = student.status;
              if (studentClassId && status) {
                attendanceMap[classRoomId][studentClassId] = status;
              }
            });
          }
        });
      }
      
      setClassData(prevData => 
        prevData.map(classItem => {
          const classRoomId = classItem.id;
          const classAttendance = attendanceMap[classRoomId || 0] || {};
          
          return {
            ...classItem,
            students: classItem.students.map(student => {
              const studentClassId = student.studentClassId;
              const status = studentClassId ? classAttendance[studentClassId] : null;
              
              let mappedStatus: "attended" | "late" | "absent" | undefined;
              if (status) {
                const statusUpper = String(status).toUpperCase();
                if (statusUpper === "ATTEND") {
                  mappedStatus = "attended";
                } else if (statusUpper === "LATE") {
                  mappedStatus = "late";
                } else if (statusUpper === "ABSENT") {
                  mappedStatus = "absent";
                }
              }
              
              return {
                ...student,
                status: mappedStatus,
              };
            })
          };
        })
      );
    } catch (error) {
      console.error("결석 체크 실패:", error);
    }
  };

  return (
    <div className="w-[700px] h-[710px] flex flex-col p-2">
      <div className="flex items-center justify-between mb-6 gap-4 sticky top-0 bg-transparent z-10 pb-2">
        <h2 className="text-2xl font-semibold whitespace-nowrap">학생 출석</h2>
        <div
          className={`relative flex items-center overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0 ${
            isSearchOpen ? "w-64" : "w-10"
          }`}
        >
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="absolute left-0 z-10 flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </button>
          <Input
            placeholder="이름을 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 bg-gray-50 border-none transition-all duration-300 ${
              isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-2 pb-4">
          {isLoading ? (
            <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
              로딩 중...
            </div>
          ) : filteredClassData.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
              {searchQuery ? "검색 결과가 없습니다" : "반이 없습니다"}
            </div>
          ) : (
            filteredClassData.map((classItem, index) => (
            <div 
              key={`${classItem.schoolType}-${classItem.grade}-${classItem.classNumber}`} 
              className="w-[330px] h-[450px] bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col flex-shrink-0"
            >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#5E99FF]">
                {getSchoolTypeName(classItem.schoolType)} {classItem.grade}학년 {classItem.classNumber}반
              </h3>
              <span className="text-sm text-[#5E99FF]">담임: {classItem.teacherName}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">번호</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">이름</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">출석 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {classItem.students.map((student, idx) => (
                    <tr key={student.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{idx + 1}</td>
                      <td className="py-3 px-4 text-sm">{student.name}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleAttendanceClick(student.id, student.studentClassId || classItem.id || 0)}
                          disabled={student.status === "attended" || student.status === "late"}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-opacity ${
                            student.status === "attended"
                              ? "bg-[#9EFC9B] text-[#00CB18] cursor-not-allowed"
                              : student.status === "late"
                              ? "bg-[#FCD39B] text-[#F39200] cursor-not-allowed"
                              : "bg-[#d9d9d9] text-[#697077] hover:opacity-90"
                          }`}
                        >
                          {student.status === "attended" ? "출석" : student.status === "late" ? "지각" : "출석"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            ))
          )}
        </div>
      </div>
      
      <Alert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        type={alertType}
        message={alertMessage}
      />
    </div>
  );
}


import type { StudentDailyAttendance } from "@/app/(shared)/(api)/attendance";
import type { NewFriend } from "@/app/(shared)/(api)/newFriends";

export interface RaffleParticipant {
  id: string;
  name: string;
  source: "student" | "friend";
  detail: string;
}

export interface RaffleWinner extends RaffleParticipant {
  round: number;
}

export function buildRaffleParticipants(students: StudentDailyAttendance[], friends: NewFriend[]): RaffleParticipant[] {
  const participants = new Map<string, RaffleParticipant>();
  for (const student of students) {
    if (student.attendanceStatus !== "ATTEND" && student.attendanceStatus !== "LATE") continue;
    const id = `student-${student.studentId}`;
    participants.set(id, { id, name: student.studentName, source: "student", detail: `학생 번호 ${student.studentId} · ${student.attendanceStatus === "LATE" ? "지각" : "출석"}` });
  }
  for (const friend of friends) {
    const id = `friend-${friend.id}`;
    participants.set(id, { id, name: friend.name, source: "friend", detail: `생년월일 ${friend.birth}${friend.studentName ? ` · 초대 ${friend.studentName}` : ""}` });
  }
  // 이름이 같아도 서로 다른 사람일 수 있으므로 ID로만 중복을 제거한다.
  return [...participants.values()].sort((a, b) => a.name.localeCompare(b.name, "ko") || a.id.localeCompare(b.id));
}

function randomIndex(max: number): number {
  const range = 0x100000000;
  const limit = range - (range % max);
  const values = new Uint32Array(1);
  do { crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % max;
}

export function drawParticipant(participants: RaffleParticipant[]): RaffleParticipant {
  if (!participants.length) throw new Error("추첨 가능한 대상자가 없습니다.");
  return participants[randomIndex(participants.length)];
}

export function raffleResultsCsv(date: string, winners: RaffleWinner[]): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return `"${(/^[\s]*[=+@-]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + [
    ["날짜", "회차", "이름", "구분", "참가자 ID", "참가자 정보"],
    ...winners.map((winner) => [date, winner.round, winner.name, winner.source === "student" ? "출석 학생" : "초청 친구", winner.id, winner.detail]),
  ].map((row) => row.map(cell).join(",")).join("\r\n");
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CardSwap, { Card } from "@/components/ui/CardSwap";
import SpecularButton from "@/components/ui/SpecularButton";
import Stepper, { Step } from "@/components/ui/Stepper";
import { CheckCircle2, Bot, BarChart3, X } from "lucide-react";
import { login, signup, refresh } from "./(shared)/(api)/auth";
import useAuthStore from "./(shared)/(store)/authStore";
import { setCookie, getCookie, removeCookie, epochSecondsToDate } from "@/lib/utils";
import Alert from "./(shared)/(modal)/Alert";

const highlights = [
  {
    title: "실시간 출석 체크",
    description: "실시간으로 출석 상태를 확인하고 기록할 수 있습니다.",
    icon: CheckCircle2,
    images: ["/images/attendance.png"],
  },
  {
    title: "AI 출석 에이전트",
    description: "AI가 출석 데이터를 분석하여 적절한 피드백을 제공합니다.",
    icon: Bot,
    images: ["/images/aichat2.png"],
  },
  {
    title: "통계 리포트",
    description: "출석 통계와 리포트를 통해 출석 현황을 쉽게 파악할 수 있습니다.",
    icon: BarChart3,
    images: ["/images/statistics.png"],
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setAccessToken } = useAuthStore();
  const [checkingSession, setCheckingSession] = useState(true);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // refreshToken이 남아있으면 accessToken을 재발급받아 로그인 화면을 건너뛰고 대시보드로 보낸다.
  useEffect(() => {
    const refreshToken = getCookie("refreshToken");
    if (!refreshToken) {
      setCheckingSession(false);
      return;
    }

    refresh(refreshToken)
      .then((data) => {
        if (data.admin) {
          setAuth(data.accessToken, data.admin);
        } else {
          setAccessToken(data.accessToken);
        }
        if (data.refreshToken) {
          setCookie(
            "refreshToken",
            data.refreshToken,
            data.refreshTokenExpiresAt ? epochSecondsToDate(data.refreshTokenExpiresAt) : undefined
          );
        }
        router.replace("/dashboard");
      })
      .catch(() => {
        removeCookie("refreshToken");
        setCheckingSession(false);
      });
  }, [router, setAuth, setAccessToken]);

  const [signupOpen, setSignupOpen] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [signupId, setSignupId] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    try {
      const data = await login(id, password);
      setAuth(data.accessToken, data.admin);
      setCookie("refreshToken", data.refreshToken, epochSecondsToDate(data.refreshTokenExpiresAt));
      router.push("/dashboard");
    } catch {
      setLoginError("ID 또는 비밀번호를 확인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSignupForm = () => {
    setSignupStep(1);
    setSignupId("");
    setSignupPassword("");
    setSignupPasswordConfirm("");
    setSignupName("");
    setSignupEmail("");
    setSignupPhone("");
  };

  const isPasswordStepInvalid =
    signupStep === 2 &&
    (signupPassword.length < 8 || signupPassword !== signupPasswordConfirm);

  const handleSignupComplete = async () => {
    try {
      await signup({
        username: signupId,
        password: signupPassword,
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
      });
      setAlertType("success");
      setAlertMessage("회원가입이 완료되었습니다. 로그인해주세요.");
      setAlertOpen(true);
      return true;
    } catch (error: any) {
      setAlertType("error");
      setAlertMessage(error.message || "회원가입에 실패했습니다.");
      setAlertOpen(true);
      return false;
    }
  };

  if (checkingSession) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-b from-[#FFFFFF] to-[#ECEDFF] dark:from-gray-900 dark:to-gray-950" />
    );
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-linear-to-b from-[#FFFFFF] to-[#ECEDFF] dark:from-gray-900 dark:to-gray-950 px-4">
      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl bg-transparent lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-6 p-12 text-center">
          <Image src="/images/logo.png" alt="logo" width={140} height={64} priority />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-[#2C79FF]">파워웨이브 3부 출석부</h1>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="id" className="text-gray-900 dark:text-gray-100">아이디</Label>
              <Input
                id="id"
                name="id"
                autoComplete="username"
                spellCheck={false}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:text-gray-900 dark:focus:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:border-[#2C79FF] focus-visible:ring-[#2C79FF]/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 focus:text-gray-900 dark:focus:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:border-[#2C79FF] focus-visible:ring-[#2C79FF]/30"
              />
            </div>

            {loginError && <p className="text-sm text-red-500">{loginError}</p>}

            <Dialog
              open={signupOpen}
              onOpenChange={(open) => {
                setSignupOpen(open);
                if (!open) resetSignupForm();
              }}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="self-end text-sm text-[#2C79FF] underline-offset-4 hover:underline"
                >
                  회원가입
                </button>
              </DialogTrigger>
              <DialogContent
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                showCloseButton={false}
              >
                <DialogClose className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-hidden disabled:pointer-events-none z-50 cursor-pointer">
                  <X className="w-6 h-6" />
                  <span className="sr-only">Close</span>
                </DialogClose>
                <DialogHeader>
                  <DialogTitle>회원가입</DialogTitle>
                  <DialogDescription>아래 단계를 따라 회원가입을 진행하세요.</DialogDescription>
                </DialogHeader>

                <Stepper
                  backButtonText="이전"
                  nextButtonText="다음"
                  completeButtonText="완료"
                  completingButtonText="가입 처리 중..."
                  onStepChange={setSignupStep}
                  nextButtonProps={{ disabled: isPasswordStepInvalid }}
                  validateStep={(step) =>
                    step !== 2 || (signupPassword.length >= 8 && signupPassword === signupPasswordConfirm)
                  }
                  onComplete={handleSignupComplete}
                  onFinalStepCompleted={() => {
                    setSignupOpen(false);
                    resetSignupForm();
                  }}
                >
                  <Step>
                    <div className="flex flex-col gap-1.5 text-left">
                      <Label htmlFor="signup-id">아이디</Label>
                      <Input
                        id="signup-id"
                        autoComplete="username"
                        value={signupId}
                        onChange={(e) => setSignupId(e.target.value)}
                        placeholder="사용할 아이디를 입력하세요"
                      />
                    </div>
                  </Step>
                  <Step>
                    <div className="flex flex-col gap-4 text-left">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="signup-password">비밀번호</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          autoComplete="new-password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="8자 이상 입력하세요"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="signup-password-confirm">비밀번호 확인</Label>
                        <Input
                          id="signup-password-confirm"
                          type="password"
                          autoComplete="new-password"
                          value={signupPasswordConfirm}
                          onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                          placeholder="비밀번호를 다시 입력하세요"
                        />
                      </div>
                      {signupPassword.length > 0 && signupPassword.length < 8 && (
                        <p className="text-xs text-red-500">비밀번호는 최소 8글자 이상이어야 합니다.</p>
                      )}
                      {signupPasswordConfirm.length > 0 && signupPassword !== signupPasswordConfirm && (
                        <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                      )}
                    </div>
                  </Step>
                  <Step>
                    <div className="flex flex-col gap-4 text-left">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="signup-name">이름</Label>
                        <Input
                          id="signup-name"
                          autoComplete="name"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="이름을 입력하세요"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="signup-email">이메일</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="이메일을 입력하세요"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="signup-phone">휴대폰 번호</Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          autoComplete="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="휴대폰 번호를 입력하세요"
                        />
                      </div>
                    </div>
                  </Step>
                  <Step>
                    <div className="flex flex-col gap-3 text-left">
                      <h3 className="text-lg font-bold text-[#2C79FF]">가입 정보 확인</h3>
                      <dl className="flex flex-col gap-2 rounded-lg bg-[#F2F4F6] dark:bg-gray-800 p-4 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#697077] dark:text-gray-400">아이디</dt>
                          <dd className="font-medium text-[#1B1C1E] dark:text-gray-100">{signupId}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#697077] dark:text-gray-400">비밀번호</dt>
                          <dd className="font-medium text-[#1B1C1E] dark:text-gray-100">
                            {"•".repeat(signupPassword.length)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#697077] dark:text-gray-400">이름</dt>
                          <dd className="font-medium text-[#1B1C1E] dark:text-gray-100">{signupName}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#697077] dark:text-gray-400">이메일</dt>
                          <dd className="font-medium text-[#1B1C1E] dark:text-gray-100">{signupEmail}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-[#697077] dark:text-gray-400">휴대폰 번호</dt>
                          <dd className="font-medium text-[#1B1C1E] dark:text-gray-100">{signupPhone}</dd>
                        </div>
                      </dl>
                    </div>
                  </Step>
                </Stepper>
              </DialogContent>
            </Dialog>

            <SpecularButton
              type="submit"
              size="md"
              className="mt-2 w-full"
              tint="#2C79FF"
              tintOpacity={1}
              textColor="#ffffff"
              lineColor="#ffffff"
              baseColor="#1B4FB8"
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </SpecularButton>
          </form>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -bottom-16 -right-16 h-[500px] w-[600px]">
            <CardSwap width={500} height={400} cardDistance={60} verticalDistance={70} delay={4000} pauseOnHover>
              {highlights.map((item) => (
                <Card key={item.title} className="flex flex-col gap-3 overflow-hidden p-6 text-left">
                  <div className="flex items-center gap-2">
                    <item.icon className="size-5 shrink-0 text-[#2C79FF]" />
                    <h3 className="text-lg font-bold text-[#2C79FF]">{item.title}</h3>
                  </div>
                  <p className="text-sm text-[#697077] dark:text-gray-400">{item.description}</p>
                  <div className="flex flex-1 gap-2">
                    {item.images.map((src) => (
                      <div key={src} className="relative flex-1 overflow-hidden rounded-lg border border-[#E8ECFF] dark:border-gray-700">
                        <Image
                          src={src}
                          alt=""
                          fill
                          quality={95}
                          sizes={item.images.length > 1 ? "220px" : "450px"}
                          className="object-cover object-top"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>

      <Alert open={alertOpen} onOpenChange={setAlertOpen} type={alertType} message={alertMessage} />
    </div>
  );
}
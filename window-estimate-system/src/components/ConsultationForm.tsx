"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ConsultationFormProps {
  quoteData: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ConsultationForm({ quoteData, onSuccess, onCancel }: ConsultationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name || !formData.phone) {
      setError("이름과 연락처는 필수항목입니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            ...formData,
            preferredDate: date ? format(date, 'yyyy-MM-dd') : '미지정'
          },
          quoteData: quoteData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "제출에 실패했습니다.");
      }
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-300">
      <div className="text-center">
        <h3 className="text-xl font-extrabold text-slate-900">방문 상담 신청</h3>
        <p className="text-sm text-slate-500 mt-1">상담을 위한 최소한의 개인정보만 수집합니다.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium text-center">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">성함</Label>
          <Input 
            id="name" 
            placeholder="홍길동" 
            required 
            className="h-12 text-base"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">연락처</Label>
          <Input 
            id="phone" 
            type="tel" 
            placeholder="010-0000-0000" 
            required 
            className="h-12 text-base"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">시공 예정지 주소 (개략)</Label>
          <Input 
            id="address" 
            placeholder="OO시 OO구 (동까지만 입력 가능)" 
            className="h-12 text-base"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div className="space-y-2 flex flex-col">
          <Label className="mb-1">상담 희망일</Label>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="w-full h-12 justify-start text-left font-normal" />}>
                {date ? format(date, 'PPP', { locale: ko }) : <span>날짜를 선택하세요</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-14 rounded-xl font-bold">
            취소
          </Button>
          <Button type="submit" disabled={loading} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg">
            {loading ? "전송 중..." : "신청 완료하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}

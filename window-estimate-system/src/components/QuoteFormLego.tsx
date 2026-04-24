"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Building2, Home, Building } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Configuration = {
  config_id: string;
  pyeong: string;
  expansion: string;
  space_name: string;
  space_order: string;
  window_type: string;
  std_width: string;
  std_height: string;
  quantity: number;
  recommend_product_id: string;
};

/**
 * 스마트 레고식 입력 폼 (전면 개편)
 * 평형과 확장여부만 선택하면 db_configurations_v2.csv에서 공간을 자동 매핑함
 */
export default function QuoteFormLego({ onComplete }: { onComplete: (json: any) => void }) {
  const [step, setStep] = useState(1);
  const [housingType, setHousingType] = useState<string>("아파트");
  const [pyeong, setPyeong] = useState<string>("30");
  const [expansion, setExpansion] = useState<string>("확장형");
  
  const [allConfigs, setAllConfigs] = useState<Configuration[]>([]);
  const [currentConfigs, setCurrentConfigs] = useState<Configuration[]>([]);

  // CSV 자동 파싱
  useEffect(() => {
    fetch('/db_configurations_v2.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return;
        
        const headers = lines[0].split(',').map(h => h.trim());
        const parsed: Configuration[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(',');
          const obj: any = {};
          
          headers.forEach((header, index) => {
            obj[header] = cols[index] ? cols[index].trim() : '';
          });
          
          obj.quantity = parseInt(obj.quantity || "1", 10);
          parsed.push(obj as Configuration);
        }
        setAllConfigs(parsed);
      })
      .catch(err => console.error("CSV 로드 오류:", err));
  }, []);

  const handleNext = () => {
    if (step === 3) {
      // Step 4 전환 직전 자동 구성 세팅
      const filtered = allConfigs.filter(
        c => c.pyeong === pyeong && c.expansion === expansion
      );
      // 순서 정렬
      filtered.sort((a, b) => parseInt(a.space_order) - parseInt(b.space_order));
      setCurrentConfigs(filtered);
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const updateQuantity = (config_id: string, delta: number) => {
    setCurrentConfigs(prev => prev.map(c => {
      if (c.config_id === config_id) {
        return { ...c, quantity: Math.max(0, c.quantity + delta) };
      }
      return c;
    }));
  };

  const handleSubmit = () => {
    const resultJson = {
      type: "smart-lego",
      data: {
        housingType,
        pyeong,
        expansion,
        configurations: currentConfigs.filter(c => c.quantity > 0)
      }
    };
    
    console.log("=== [Smart Lego Form Submitted JSON] ===");
    console.log(JSON.stringify(resultJson, null, 2));
    onComplete(resultJson);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">
          {step === 1 && "주거 형태를 선택해주세요"}
          {step === 2 && "평형대를 선택해주세요"}
          {step === 3 && "발코니 확장 여부를 선택해주세요"}
          {step === 4 && "자동 세팅된 창호를 확인해주세요"}
        </CardTitle>
        <CardDescription>
          {step === 4 ? "설치할 공간의 창호 개수를 조절할 수 있습니다." : "스마트 견적을 위한 기본 정보입니다."}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 min-h-[300px]">
        {/* 애니메이션 최소화: 단순 transition-opacity */}
        <div className="transition-opacity duration-300">
          
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[ { id: '아파트', icon: Building2 }, { id: '빌라', icon: Home }, { id: '단독주택', icon: Building } ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => setHousingType(item.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    housingType === item.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <item.icon className="w-10 h-10 mb-3 opacity-80" />
                  <span className="font-semibold text-lg">{item.id}</span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {['20', '30', '40', '50'].map(val => (
                <div 
                  key={val}
                  onClick={() => setPyeong(val)}
                  className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 cursor-pointer transition-all ${
                    pyeong === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <span className="font-bold text-2xl">{val}평대</span>
                  {val === '50' && <span className="text-sm opacity-70 mt-1">이상 포함</span>}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['확장형', '비확장형'].map(val => (
                <div 
                  key={val}
                  onClick={() => setExpansion(val)}
                  className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 cursor-pointer transition-all ${
                    expansion === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <span className="font-bold text-xl">{val}</span>
                  <span className="text-sm opacity-70 mt-2">
                    {val === '확장형' ? '발코니를 확장한 구조입니다' : '기본 발코니가 있는 구조입니다'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {currentConfigs.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    해당 평형의 표준 세팅 데이터가 올바르지 않습니다.
                  </div>
                ) : (
                  currentConfigs.map((config) => (
                    <div key={config.config_id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{config.space_name}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {config.window_type} · {config.std_width}x{config.std_height}
                        </p>
                      </div>
                      <div className="flex items-center bg-slate-100 rounded-full p-1 border">
                        <button 
                          onClick={() => updateQuantity(config.config_id, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50"
                          disabled={config.quantity === 0}
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="w-10 text-center font-semibold">{config.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(config.config_id, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

        </div>
      </CardContent>

      <CardFooter className="px-0 flex justify-between gap-4 border-t pt-4 mt-4">
        {step > 1 && (
          <Button variant="outline" onClick={handlePrev} className="w-1/3">
            이전
          </Button>
        )}
        
        {step < 4 ? (
          <Button onClick={handleNext} className={step === 1 ? "w-full" : "w-2/3"}>
            다음 단계
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="w-2/3 bg-blue-600 hover:bg-blue-700 font-bold">
            이대로 견적 확인
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

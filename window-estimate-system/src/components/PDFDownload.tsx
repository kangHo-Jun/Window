"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';

// 로컬 폰트 레지스터 (서버 내장 폰트 다운로드 기반)
Font.register({
  family: 'NanumGothic',
  src: '/fonts/NanumGothic-Regular.ttf'
});

// PDF 스타일 정의
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'NanumGothic', backgroundColor: '#FFFFFF' },
  header: { marginBottom: 30, borderBottom: '2px solid #1e40af', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e40af' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { margin: 10, padding: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: 5, marginBottom: 10, color: '#0f172a' },
  textRow: { flexDirection: 'row', marginBottom: 5, fontSize: 11, lineHeight: 1.5, color: '#334155' },
  label: { width: 120, fontWeight: 'bold' },
  value: { flex: 1 },
  highlightBox: { backgroundColor: '#f0f9ff', padding: 15, borderRadius: 5, marginTop: 15 },
  highlightTitle: { fontSize: 14, fontWeight: 'bold', color: '#0369a1', marginBottom: 5 },
  highlightText: { fontSize: 11, lineHeight: 1.6, color: '#0284c7' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 10, borderTop: '1px solid #e2e8f0', paddingTop: 10 }
});

// PDF 문서 컴포넌트 
const OutputDocument = ({ quoteData }: { quoteData: any }) => {
  // 하드코딩 문서 컨텐츠 (Phase 3 범위)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>창호 컨설팅 견적 및 비교 요약 보고서</Text>
          <Text style={styles.subtitle}>고객 맞춤 스마트 자동 견적 (SYNC 시스템)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 고객 입력 사항 요약</Text>
          <View style={styles.textRow}>
             <Text style={styles.label}>견적 방식</Text>
             <Text style={styles.value}>{quoteData.type === 'smart-lego' ? '스마트 상세 구성' : '대화형 간편 견적'}</Text>
          </View>
          <View style={styles.textRow}>
             <Text style={styles.label}>주거 및 공간 정보</Text>
             <Text style={styles.value}>
               {quoteData.type === 'smart-lego' ? 
                  `${quoteData.data.housingType || '아파트'} | ${quoteData.data.pyeong || '30'}평대 | ${quoteData.data.expansion || '비확장형'}` : 
                  `공간: ${quoteData.data.space || '-'}, 수량: ${quoteData.data.count || '-'}`
               }
             </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 3사 브랜드 비교</Text>
          <View style={styles.textRow}>
             <Text style={styles.label}>[프리미엄] LX지인</Text>
             <Text style={styles.value}>최종 예상 견적가: 17,100,000원 (제품 마진 및 시공비 포함)</Text>
          </View>
          <View style={styles.textRow}>
             <Text style={styles.label}>[중간 모델] KCC글라스</Text>
             <Text style={styles.value}>최종 예상 견적가: 12,658,500원 (제품 마진 및 시공비 포함)</Text>
          </View>
          <View style={styles.textRow}>
             <Text style={styles.label}>[실속형] 기타</Text>
             <Text style={styles.value}>최종 예상 견적가: 9,660,000원 (제품 마진 및 시공비 포함)</Text>
          </View>
        </View>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>3. AI 전문가 추천 요약</Text>
          <Text style={styles.highlightText}>
            현재 고객님의 구성 상태와 장기 거주 목적을 고려할 때 {`\n`}
            [LX지인] 브랜드 시공을 가장 추천합니다.{`\n\n`}
            기존 창호 대비 교체 시 10년 누적 기준 약 120만 원 이상의 난방비 절감 효과가 예상되며,
            대량 구매 할인 혜택이 적용되어 프리미엄 모델을 합리적인 예산으로 만나실 수 있습니다.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>본 견적은 예상견적이며, 현장 실측 시 사이즈 및 옵션(유리, 핸들 등)에 따라 금액이 변동될 수 있습니다.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function PDFDownload({ quoteData }: { quoteData: any }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="w-full">
      <PDFDownloadLink
        document={<OutputDocument quoteData={quoteData} />}
        fileName="window_estimate_report.pdf"
      >
        {({ blob, url, loading, error }) => (
           <Button 
              size="lg" 
              className={`w-full ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-6 rounded-xl transition-all shadow-md`}
              disabled={loading}
           >
              {loading ? (
                <span className="flex items-center gap-2">
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   PDF 인쇄 준비 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                   </svg>
                   PDF로 상세 견적서 다운로드
                </span>
              )}
           </Button>
        )}
      </PDFDownloadLink>
      <p className="text-center text-xs text-slate-400 mt-2">
         * PDF 다운로드 시 약 1~2초 정도 소요될 수 있습니다. CDN 폰트 폴백 지원 완료.
      </p>
    </div>
  );
}

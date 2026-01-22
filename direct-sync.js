// Product Data (제품 정보)
const products = [
    {
        id: 'auto-ventilation',
        name: '침실용 창+발코니 이중창+거실 이중창',
        category: '이중창',
        description: '자동 환기 시스템이 내장된 고급 이중창'
    },
    {
        id: 'sliding-door',
        name: '복도 창+거실 가벽 슬라이딩',
        category: '슬라이딩',
        description: '공간 활용도가 높은 슬라이딩 도어'
    },
    {
        id: 'double-window',
        name: '안방+거실+발코니 이중창+발코니',
        category: '이중창',
        description: '단열 성능이 우수한 기본 이중창'
    },
    {
        id: 'folding-door',
        name: '거실용 폴딩도어 스마트발코니',
        category: '폴딩도어',
        description: '개방감이 뛰어난 폴딩 도어'
    }
];

// Spaces by Type (평형별 공간 매핑)
const spacesByType = {
    '20평대-비확장형': ['거실', '안방', '침실1', '침실2', '주방', '다용도실', '앞발코니', '뒷발코니'],
    '20평대-확장형': ['거실', '안방', '침실1', '침실2', '주방', '다용도실', '안방발코니', '터닝도어'],
    '30평대-비확장형': ['거실', '안방', '침실1', '침실2', '알파룸', '주방', '다용도실', '앞발코니', '뒷발코니'],
    '30평대-확장형': ['거실', '안방', '침실1', '침실2', '알파룸', '주방', '다용도실', '안방발코니', '터닝도어'],
    '40평대-비확장형': ['거실', '안방', '침실1', '침실2', '침실3', '주방', '다용도실', '드레스룸', '발코니(전체)'],
    '40평대-확장형': ['거실', '안방', '침실1', '침실2', '침실3', '주방', '다용도실', '드레스룸', '안방발코니', '터닝도어'],
    '50평대-비확장형': ['거실', '안방', '침실1', '침실2', '침실3', '침실4', '주방', '다용도실', '드레스룸', '서재', '발코니'],
    '50평대-확장형': ['거실', '안방', '침실1', '침실2', '침실3', '침실4', '주방', '다용도실', '드레스룸', '서재', '안방발코니', '터닝도어']
};

// Price Table (가격 테이블 - 가로/세로 범위별 가격)
// 형식: { productId, widthMin, widthMax, heightMin, heightMax, price }
const priceTable = [
    // auto-ventilation (자동환기창)
    { productId: 'auto-ventilation', widthMin: 500, widthMax: 1500, heightMin: 500, heightMax: 1200, price: 800000 },
    { productId: 'auto-ventilation', widthMin: 1501, widthMax: 2500, heightMin: 500, heightMax: 1200, price: 1200000 },
    { productId: 'auto-ventilation', widthMin: 2501, widthMax: 3500, heightMin: 500, heightMax: 1200, price: 1600000 },
    { productId: 'auto-ventilation', widthMin: 500, widthMax: 1500, heightMin: 1201, heightMax: 2000, price: 1000000 },
    { productId: 'auto-ventilation', widthMin: 1501, widthMax: 2500, heightMin: 1201, heightMax: 2000, price: 1500000 },
    { productId: 'auto-ventilation', widthMin: 2501, widthMax: 3500, heightMin: 1201, heightMax: 2000, price: 2000000 },
    { productId: 'auto-ventilation', widthMin: 3501, widthMax: 10000, heightMin: 2001, heightMax: 5000, price: 3500000 },

    // sliding-door (슬라이딩 도어)
    { productId: 'sliding-door', widthMin: 500, widthMax: 1500, heightMin: 500, heightMax: 1500, price: 900000 },
    { productId: 'sliding-door', widthMin: 1501, widthMax: 2500, heightMin: 500, heightMax: 1500, price: 1400000 },
    { productId: 'sliding-door', widthMin: 2501, widthMax: 3500, heightMin: 500, heightMax: 1500, price: 1900000 },
    { productId: 'sliding-door', widthMin: 500, widthMax: 1500, heightMin: 1501, heightMax: 2500, price: 1200000 },
    { productId: 'sliding-door', widthMin: 1501, widthMax: 2500, heightMin: 1501, heightMax: 2500, price: 1800000 },
    { productId: 'sliding-door', widthMin: 2501, widthMax: 3500, heightMin: 1501, heightMax: 2500, price: 2400000 },
    { productId: 'sliding-door', widthMin: 3501, widthMax: 10000, heightMin: 2501, heightMax: 5000, price: 4000000 },

    // double-window (일반 이중창)
    { productId: 'double-window', widthMin: 500, widthMax: 1500, heightMin: 500, heightMax: 1200, price: 600000 },
    { productId: 'double-window', widthMin: 1501, widthMax: 2500, heightMin: 500, heightMax: 1200, price: 900000 },
    { productId: 'double-window', widthMin: 2501, widthMax: 3500, heightMin: 500, heightMax: 1200, price: 1200000 },
    { productId: 'double-window', widthMin: 500, widthMax: 1500, heightMin: 1201, heightMax: 2000, price: 800000 },
    { productId: 'double-window', widthMin: 1501, widthMax: 2500, heightMin: 1201, heightMax: 2000, price: 1200000 },
    { productId: 'double-window', widthMin: 2501, widthMax: 3500, heightMin: 1201, heightMax: 2000, price: 1600000 },
    { productId: 'double-window', widthMin: 3501, widthMax: 10000, heightMin: 2001, heightMax: 5000, price: 2800000 },

    // folding-door (폴딩 도어)
    { productId: 'folding-door', widthMin: 500, widthMax: 2000, heightMin: 500, heightMax: 1500, price: 1100000 },
    { productId: 'folding-door', widthMin: 2001, widthMax: 3000, heightMin: 500, heightMax: 1500, price: 1600000 },
    { productId: 'folding-door', widthMin: 3001, widthMax: 4000, heightMin: 500, heightMax: 1500, price: 2100000 },
    { productId: 'folding-door', widthMin: 500, widthMax: 2000, heightMin: 1501, heightMax: 2500, price: 1500000 },
    { productId: 'folding-door', widthMin: 2001, widthMax: 3000, heightMin: 1501, heightMax: 2500, price: 2200000 },
    { productId: 'folding-door', widthMin: 3001, widthMax: 4000, heightMin: 1501, heightMax: 2500, price: 2900000 },
    { productId: 'folding-door', widthMin: 4001, widthMax: 10000, heightMin: 2501, heightMax: 5000, price: 4500000 }
];

// State management
const state = {
    currentStep: 1,
    housingType: null,
    sizeType: null,
    expansionType: null,
    selectedSpaces: [],
    selectedProduct: null,
    spaceProducts: {},          // 공간별 제품 및 사이즈 저장: { '거실': { product: 'xxx', width: 3000, height: 2000 }, ... }
    currentSpaceIndex: 0        // 현재 입력 중인 공간의 인덱스
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // 공유 링크에서 데이터 로드 시도
    loadFromShareLink();

    // Step 초기화
    initializeStep1();
    initializeStep2();
    initializeStep3();
    initializeStep4();
});

// Step 1: Housing Type (아파트 자동 선택)
function initializeStep1() {
    const step1 = document.getElementById('step1');
    const nextBtn = step1.querySelector('.next-btn');

    // 아파트 자동 선택
    state.housingType = 'apartment';

    nextBtn.addEventListener('click', () => {
        goToStep(2);
    });
}

// Step 2: Size Type (8가지 조합 한 번에 선택)
function initializeStep2() {
    const step2 = document.getElementById('step2');
    const sizeOptions = step2.querySelectorAll('.option-btn');
    const nextBtn = step2.querySelector('.next-btn');

    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // 이전 선택 제거
            sizeOptions.forEach(opt => opt.classList.remove('selected'));

            // 현재 선택
            option.classList.add('selected');

            // state에 평형과 확장형 동시 저장
            state.sizeType = option.dataset.size;
            state.expansionType = option.dataset.expansion;

            // Next 버튼 활성화
            nextBtn.disabled = false;
        });
    });

    nextBtn.addEventListener('click', () => {
        if (state.sizeType && state.expansionType) {
            // Step 3로 이동 전 selectedSpaces 초기화
            state.selectedSpaces = [];
            goToStep(3);
        }
    });
}

// Step 3: Space Selection (동적 렌더링 + 전체 선택)
function initializeStep3() {
    // Step 2에서 선택이 완료되면 renderStep3()가 호출됨
}

/**
 * renderStep3 - Step 3 동적 렌더링 (평형에 따라 공간 리스트 생성)
 */
function renderStep3() {
    const step3 = document.getElementById('step3');
    const nextBtn = step3.querySelector('.next-btn');

    // 평형 타입 키 생성 (예: '30평대-확장형')
    const typeKey = `${state.sizeType}평대-${state.expansionType === 'expanded' ? '확장형' : '비확장형'}`;
    const spaces = spacesByType[typeKey] || [];

    // 공간 리스트 컨테이너 찾기 또는 생성
    let spaceContainer = step3.querySelector('.space-selection-container');
    if (!spaceContainer) {
        spaceContainer = document.createElement('div');
        spaceContainer.className = 'space-selection-container';

        // step-subdescription 뒤에 삽입
        const subdesc = step3.querySelector('.step-subdescription');
        if (subdesc) {
            subdesc.after(spaceContainer);
        } else {
            const description = step3.querySelector('.step-description');
            description.after(spaceContainer);
        }
    }

    // 전체 선택 체크박스 + 공간 그리드 생성
    spaceContainer.innerHTML = `
        <div class="select-all-container">
            <input type="checkbox" id="selectAllSpaces" class="select-all-checkbox">
            <label for="selectAllSpaces" class="select-all-label">전체 선택</label>
            <span class="select-all-description">총 ${spaces.length}개 공간</span>
        </div>
        <div class="option-grid space-grid" id="spaceGrid">
            ${spaces.map(space => `
                <button class="option-btn space-btn" data-value="${space}">${space}</button>
            `).join('')}
        </div>
        <div class="space-info" style="margin-top: 15px;">
            <span class="icon-check">✓</span>
            <span class="space-label">선택된 공간</span>
            <span class="space-count" id="spaceCountDisplay">총 0개</span>
        </div>
    `;

    // 전체 선택 체크박스 이벤트
    const selectAllCheckbox = document.getElementById('selectAllSpaces');
    const spaceButtons = step3.querySelectorAll('.space-btn');
    const spaceCountDisplay = document.getElementById('spaceCountDisplay');

    selectAllCheckbox.addEventListener('change', () => {
        if (selectAllCheckbox.checked) {
            // 전체 선택
            state.selectedSpaces = [...spaces];
            spaceButtons.forEach(btn => btn.classList.add('selected'));
        } else {
            // 전체 해제
            state.selectedSpaces = [];
            spaceButtons.forEach(btn => btn.classList.remove('selected'));
        }
        updateSpaceCount();
    });

    // 개별 공간 버튼 이벤트
    spaceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const spaceName = button.dataset.value;

            if (button.classList.contains('selected')) {
                // 선택 해제
                button.classList.remove('selected');
                state.selectedSpaces = state.selectedSpaces.filter(s => s !== spaceName);
            } else {
                // 선택 (제한 없음)
                button.classList.add('selected');
                state.selectedSpaces.push(spaceName);
            }

            // 전체 선택 체크박스 상태 업데이트
            selectAllCheckbox.checked = state.selectedSpaces.length === spaces.length;

            updateSpaceCount();
        });
    });

    // 공간 카운트 업데이트 함수
    function updateSpaceCount() {
        spaceCountDisplay.textContent = `총 ${state.selectedSpaces.length}개`;
        nextBtn.disabled = state.selectedSpaces.length === 0;
    }

    // Next 버튼 이벤트 (기존 리스너 제거 후 재등록)
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newNextBtn.addEventListener('click', () => {
        if (state.selectedSpaces.length > 0) {
            // Step 4 진입 전 상태 초기화
            state.currentSpaceIndex = 0;
            state.spaceProducts = {};
            state.selectedProduct = null;

            goToStep(4);
        }
    });

    // 초기 상태 복원 (뒤로 가기 등)
    if (state.selectedSpaces.length > 0) {
        state.selectedSpaces.forEach(spaceName => {
            const button = Array.from(spaceButtons).find(btn => btn.dataset.value === spaceName);
            if (button) {
                button.classList.add('selected');
            }
        });
        selectAllCheckbox.checked = state.selectedSpaces.length === spaces.length;
        updateSpaceCount();
    }
}

// Step 4: Product Selection (공간별 순차 입력)
function initializeStep4() {
    // Step 4로 진입할 때마다 렌더링
    // goToStep(4)가 호출되면 renderStep4()가 실행됨
}

// Step 4 렌더링: 공간 탭 + 제품 선택 + 사이즈 입력
function renderStep4() {
    // 공간 탭 렌더링
    renderStep4SpaceTabs();

    // 현재 공간 제목 업데이트
    const currentSpace = state.selectedSpaces[state.currentSpaceIndex];
    const currentSpaceTitle = document.getElementById('currentSpaceTitle');
    currentSpaceTitle.textContent = `${currentSpace}의 창호를 선택해주세요.`;

    // 제품 선택 이벤트 리스너 설정
    setupProductSelection();

    // 사이즈 입력 이벤트 리스너 설정
    setupSizeInput();

    // "다음 공간" 버튼 이벤트 리스너 설정
    setupNextSpaceButton();

    // 기존에 입력된 데이터가 있으면 복원
    restoreSpaceData(currentSpace);
}

// 공간 탭 렌더링
function renderStep4SpaceTabs() {
    const spaceTabs = document.getElementById('spaceTabs');
    spaceTabs.innerHTML = '';

    state.selectedSpaces.forEach((space, index) => {
        const tab = document.createElement('div');
        tab.className = 'space-tab';
        tab.textContent = space;

        // 탭 상태 설정
        if (state.spaceProducts[space]) {
            // 완료된 공간
            tab.classList.add('completed');
        } else if (index === state.currentSpaceIndex) {
            // 현재 입력 중인 공간
            tab.classList.add('current');
        } else {
            // 대기 중인 공간
            tab.classList.add('pending');
        }

        spaceTabs.appendChild(tab);
    });
}

// 제품 선택 설정
function setupProductSelection() {
    const productCards = document.querySelectorAll('.product-card');
    const sizeInputSection = document.getElementById('sizeInputSection');

    productCards.forEach(card => {
        // 기존 이벤트 리스너 제거를 위해 복제
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
    });

    // 새로운 이벤트 리스너 추가
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            // 이전 선택 제거
            document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));

            // 현재 선택
            card.classList.add('selected');
            state.selectedProduct = card.dataset.product;

            // 사이즈 입력 폼 표시
            sizeInputSection.style.display = 'block';

            // 입력값 검증
            validateStep4Input();
        });
    });
}

// 사이즈 입력 설정
function setupSizeInput() {
    const widthInput = document.getElementById('windowWidth');
    const heightInput = document.getElementById('windowHeight');

    // 입력 이벤트 리스너
    [widthInput, heightInput].forEach(input => {
        input.addEventListener('input', () => {
            validateStep4Input();
        });
    });
}

// 입력값 검증 (@verification-before-completion)
function validateStep4Input() {
    const widthInput = document.getElementById('windowWidth');
    const heightInput = document.getElementById('windowHeight');
    const nextBtn = document.getElementById('nextSpaceBtn');

    // 검증 조건: 제품 선택 + 가로/세로 입력 필수
    const isProductSelected = state.selectedProduct !== null;
    const isWidthValid = widthInput.value && parseInt(widthInput.value) >= 500 && parseInt(widthInput.value) <= 10000;
    const isHeightValid = heightInput.value && parseInt(heightInput.value) >= 500 && parseInt(heightInput.value) <= 5000;

    if (isProductSelected && isWidthValid && isHeightValid) {
        nextBtn.disabled = false;
    } else {
        nextBtn.disabled = true;
    }
}

// "다음 공간" 버튼 설정
function setupNextSpaceButton() {
    const nextBtn = document.getElementById('nextSpaceBtn');
    const currentSpace = state.selectedSpaces[state.currentSpaceIndex];

    // 버튼 텍스트 변경 (마지막 공간이면 "결과 보기")
    if (state.currentSpaceIndex === state.selectedSpaces.length - 1) {
        nextBtn.textContent = '결과 보기';
    } else {
        nextBtn.textContent = '다음 공간';
    }

    // 기존 이벤트 리스너 제거를 위해 복제
    const newBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newBtn, nextBtn);

    // 새로운 이벤트 리스너
    document.getElementById('nextSpaceBtn').addEventListener('click', () => {
        // 입력값 최종 검증
        const widthInput = document.getElementById('windowWidth');
        const heightInput = document.getElementById('windowHeight');

        if (!state.selectedProduct) {
            showToast('제품을 선택해주세요.');
            return;
        }

        if (!widthInput.value || !heightInput.value) {
            showToast('가로와 세로 사이즈를 모두 입력해주세요.');
            return;
        }

        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);

        if (width < 500 || width > 10000) {
            showToast('가로 사이즈는 500~10000mm 범위로 입력해주세요.');
            return;
        }

        if (height < 500 || height > 5000) {
            showToast('세로 사이즈는 500~5000mm 범위로 입력해주세요.');
            return;
        }

        // spaceProducts에 저장
        state.spaceProducts[currentSpace] = {
            product: state.selectedProduct,
            width: width,
            height: height
        };

        // 다음 공간으로 이동 또는 결과 페이지로
        if (state.currentSpaceIndex < state.selectedSpaces.length - 1) {
            // 다음 공간으로
            state.currentSpaceIndex++;

            // 현재 선택 상태 초기화
            state.selectedProduct = null;
            document.getElementById('sizeInputSection').style.display = 'none';
            widthInput.value = '';
            heightInput.value = '';

            // 다시 렌더링
            renderStep4();
        } else {
            // 모든 공간 입력 완료 - 결과 페이지로
            showResult();
        }
    });
}

// 기존 데이터 복원 (뒤로가기 등의 경우)
function restoreSpaceData(currentSpace) {
    if (state.spaceProducts[currentSpace]) {
        const data = state.spaceProducts[currentSpace];

        // 제품 선택 복원
        state.selectedProduct = data.product;
        const selectedCard = document.querySelector(`.product-card[data-product="${data.product}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // 사이즈 입력 복원
        document.getElementById('windowWidth').value = data.width;
        document.getElementById('windowHeight').value = data.height;
        document.getElementById('sizeInputSection').style.display = 'block';

        // 검증
        validateStep4Input();
    }
}

// Navigation
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    document.getElementById(`step${stepNumber}`).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update state
    state.currentStep = stepNumber;

    // Step 3 진입 시 렌더링 (평형에 따라 공간 리스트 동적 생성)
    if (stepNumber === 3) {
        renderStep3();
    }

    // Step 4 진입 시 렌더링
    if (stepNumber === 4) {
        renderStep4();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * getPriceFromRange - 가로/세로 범위에 따른 가격 계산
 * @param {string} productId - 제품 ID
 * @param {number} width - 가로 사이즈 (mm)
 * @param {number} height - 세로 사이즈 (mm)
 * @returns {number|null} - 가격 (원) 또는 null (범위에 맞는 가격이 없는 경우)
 */
function getPriceFromRange(productId, width, height) {
    // priceTable에서 해당 제품의 가격을 범위로 찾기
    const priceEntry = priceTable.find(entry =>
        entry.productId === productId &&
        width >= entry.widthMin &&
        width <= entry.widthMax &&
        height >= entry.heightMin &&
        height <= entry.heightMax
    );

    if (priceEntry) {
        return priceEntry.price;
    }

    // 범위에 맞는 가격이 없으면 기본값 반환 (또는 경고)
    console.warn(`가격을 찾을 수 없습니다: productId=${productId}, width=${width}, height=${height}`);
    return null;
}

/**
 * calculateTotalPrice - 전체 공간의 총 가격 계산
 * @param {object} spaceProducts - state.spaceProducts 객체
 * @returns {object} - { subtotal, installationFee, total, items: [] }
 */
function calculateTotalPrice(spaceProducts) {
    let subtotal = 0;
    const items = [];

    for (const [space, data] of Object.entries(spaceProducts)) {
        const product = products.find(p => p.id === data.product);
        const price = getPriceFromRange(data.product, data.width, data.height);

        if (price !== null) {
            subtotal += price;
            items.push({
                space: space,
                productName: product.name,
                width: data.width,
                height: data.height,
                price: price
            });
        } else {
            // 가격을 찾을 수 없는 경우 기본값 사용
            const defaultPrice = 1000000;
            subtotal += defaultPrice;
            items.push({
                space: space,
                productName: product.name,
                width: data.width,
                height: data.height,
                price: defaultPrice
            });
        }
    }

    // 시공비 추가 (총액의 20%)
    const installationFee = Math.round(subtotal * 0.2);
    const total = subtotal + installationFee;

    return {
        subtotal: subtotal,
        installationFee: installationFee,
        total: total,
        items: items
    };
}

/**
 * generatePDF - PDF 견적서 생성 (jsPDF + AutoTable)
 * 한글 폰트 깨짐 방지를 위해 기본 폰트 사용
 */
function generatePDF() {
    try {
        // jsPDF 인스턴스 생성
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 가격 계산
        const pricing = calculateTotalPrice(state.spaceProducts);

        // 제목
        doc.setFontSize(20);
        doc.text('Hugreen Window Estimate', 105, 20, { align: 'center' });

        // 기본 정보
        doc.setFontSize(12);
        const expansionText = state.expansionType === 'expanded' ? 'Expanded' : 'Non-Expanded';
        doc.text(`Pyeong: ${state.sizeType} / ${expansionText}`, 20, 40);
        doc.text(`Date: ${new Date().toLocaleDateString('ko-KR')}`, 20, 50);

        // 테이블 데이터 준비
        const tableData = pricing.items.map(item => {
            const size = `${item.width} x ${item.height}mm`;
            const area = ((item.width / 1000) * (item.height / 1000)).toFixed(2) + 'm²';
            const price = item.price.toLocaleString('ko-KR') + ' KRW';

            return [
                item.space,
                item.productName,
                size,
                area,
                price
            ];
        });

        // AutoTable로 테이블 생성
        doc.autoTable({
            startY: 60,
            head: [['Space', 'Product', 'Size', 'Area', 'Price']],
            body: tableData,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 5
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            }
        });

        // 총액 섹션
        const finalY = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(11);
        doc.text(`Subtotal: ${pricing.subtotal.toLocaleString('ko-KR')} KRW`, 20, finalY);
        doc.text(`Installation Fee (20%): ${pricing.installationFee.toLocaleString('ko-KR')} KRW`, 20, finalY + 8);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${pricing.total.toLocaleString('ko-KR')} KRW`, 20, finalY + 20);

        // 하단 안내문구
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('* Actual price may vary depending on site conditions.', 20, finalY + 35);
        doc.text('Contact: 1668-3142 | www.hugreen.kr', 20, finalY + 42);

        // PDF 저장
        const fileName = `Hugreen_Estimate_${state.sizeType}_${Date.now()}.pdf`;
        doc.save(fileName);

        showToast('PDF 견적서가 다운로드되었습니다.');
    } catch (error) {
        console.error('PDF 생성 오류:', error);
        showToast('PDF 생성 중 오류가 발생했습니다.');
    }
}

/**
 * generateShareLink - 공유 링크 생성 (URL 인코딩)
 * state를 JSON으로 변환하여 Base64 인코딩 후 URL 파라미터로 추가
 */
function generateShareLink() {
    try {
        // 공유할 데이터 구성
        const shareData = {
            housingType: state.housingType,
            sizeType: state.sizeType,
            expansionType: state.expansionType,
            selectedSpaces: state.selectedSpaces,
            spaceProducts: state.spaceProducts
        };

        // JSON -> Base64 인코딩
        const jsonString = JSON.stringify(shareData);
        const encoded = btoa(encodeURIComponent(jsonString));

        // 공유 URL 생성
        const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

        // 클립보드에 복사
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('공유 링크가 클립보드에 복사되었습니다!');
            console.log('공유 링크:', shareUrl);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            // 대체 방법: alert로 표시
            alert(`공유 링크:\n${shareUrl}`);
        });

        return shareUrl;
    } catch (error) {
        console.error('공유 링크 생성 오류:', error);
        showToast('공유 링크 생성 중 오류가 발생했습니다.');
    }
}

/**
 * loadFromShareLink - 페이지 로드 시 URL 파라미터에서 데이터 복원
 * @verification-before-completion: state 완벽 복원 확인
 */
function loadFromShareLink() {
    try {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');

        if (data) {
            // Base64 디코딩 -> JSON 파싱
            const decoded = JSON.parse(decodeURIComponent(atob(data)));

            // state 복원
            state.housingType = decoded.housingType;
            state.sizeType = decoded.sizeType;
            state.expansionType = decoded.expansionType;
            state.selectedSpaces = decoded.selectedSpaces;
            state.spaceProducts = decoded.spaceProducts;

            console.log('공유 링크에서 state 복원:', state);

            // 결과 페이지로 바로 이동
            showResult();

            showToast('공유 링크에서 견적을 불러왔습니다.');
        }
    } catch (error) {
        console.error('공유 링크 로드 실패:', error);
        showToast('공유 링크를 불러오는 중 오류가 발생했습니다.');
    }
}

// Show Result
function showResult() {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });

    // Show result
    document.getElementById('result').classList.add('active');

    // Update result info
    document.getElementById('result-size').textContent = state.sizeType;

    // expansionType을 한글로 표시
    const expansionText = state.expansionType === 'expanded' ? '확장형' : '비확장형';
    const resultInfo = document.querySelector('.result-info');
    resultInfo.innerHTML = `#<span id="result-size">${state.sizeType}</span>평대 #아파트 #${expansionText}`;

    // 가격 계산
    const pricing = calculateTotalPrice(state.spaceProducts);

    // 가격 표시
    document.querySelector('.price-amount').textContent =
        pricing.total.toLocaleString('ko-KR') + '원';

    // 결과 테이블 렌더링
    renderResultTable(pricing);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * renderResultTable - 결과 페이지에 선택 내역 테이블 렌더링
 */
function renderResultTable(pricing) {
    // 기존 테이블이 있으면 제거
    const existingTable = document.querySelector('.result-table');
    if (existingTable) {
        existingTable.remove();
    }

    const existingSummary = document.querySelector('.price-summary');
    if (existingSummary) {
        existingSummary.remove();
    }

    // 결과 페이지 내부에 테이블 삽입 위치 찾기
    const resultPage = document.getElementById('result');
    const priceSection = resultPage.querySelector('.price-section');

    // 테이블 생성
    const table = document.createElement('table');
    table.className = 'result-table';

    // 테이블 헤더
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>공간</th>
            <th>제품</th>
            <th>사이즈 (W x H)</th>
            <th>면적</th>
            <th>금액</th>
        </tr>
    `;
    table.appendChild(thead);

    // 테이블 바디
    const tbody = document.createElement('tbody');
    pricing.items.forEach(item => {
        const tr = document.createElement('tr');
        const area = ((item.width / 1000) * (item.height / 1000)).toFixed(2);
        tr.innerHTML = `
            <td>${item.space}</td>
            <td>${item.productName}</td>
            <td>${item.width} x ${item.height}mm</td>
            <td>${area}m²</td>
            <td class="price-cell">${item.price.toLocaleString('ko-KR')}원</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // 가격 요약 섹션 생성
    const summary = document.createElement('div');
    summary.className = 'price-summary';
    summary.innerHTML = `
        <div class="price-row">
            <span class="price-row-label">소계</span>
            <span class="price-row-value">${pricing.subtotal.toLocaleString('ko-KR')}원</span>
        </div>
        <div class="price-row">
            <span class="price-row-label">시공비 (20%)</span>
            <span class="price-row-value">${pricing.installationFee.toLocaleString('ko-KR')}원</span>
        </div>
        <div class="price-row">
            <span class="price-row-label">총 예상 금액</span>
            <span class="price-row-value">${pricing.total.toLocaleString('ko-KR')}원</span>
        </div>
    `;

    // 테이블과 요약을 가격 섹션 앞에 삽입
    priceSection.parentNode.insertBefore(table, priceSection);
    priceSection.parentNode.insertBefore(summary, priceSection);
}

// Toast notification
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    // Add to body
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

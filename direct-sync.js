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
    initializeStep1();
    initializeStep2();
    initializeStep3();
    initializeStep4();
});

// Step 1: Housing Type
function initializeStep1() {
    const step1 = document.getElementById('step1');
    const options = step1.querySelectorAll('.option-btn');
    const nextBtn = step1.querySelector('.next-btn');

    options.forEach(option => {
        option.addEventListener('click', () => {
            // Remove previous selection
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Add selection
            option.classList.add('selected');
            state.housingType = option.dataset.value;
            
            // Enable next button
            nextBtn.disabled = false;
        });
    });

    nextBtn.addEventListener('click', () => {
        if (state.housingType) {
            goToStep(2);
        }
    });
}

// Step 2: Size Type
function initializeStep2() {
    const step2 = document.getElementById('step2');
    const sizeOptions = step2.querySelectorAll('.option-btn');
    const subOptions = step2.querySelectorAll('.sub-option-btn');
    const nextBtn = step2.querySelector('.next-btn');

    sizeOptions.forEach(option => {
        option.addEventListener('click', () => {
            sizeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            state.sizeType = option.dataset.value;
            checkStep2Complete();
        });
    });

    subOptions.forEach(option => {
        option.addEventListener('click', () => {
            subOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            state.expansionType = option.dataset.value;
            checkStep2Complete();
        });
    });

    function checkStep2Complete() {
        if (state.sizeType && state.expansionType) {
            nextBtn.disabled = false;
        }
    }

    nextBtn.addEventListener('click', () => {
        if (state.sizeType && state.expansionType) {
            goToStep(3);
        }
    });
}

// Step 3: Space Selection
function initializeStep3() {
    const step3 = document.getElementById('step3');
    const spaceOptions = step3.querySelectorAll('.space-btn');
    const nextBtn = step3.querySelector('.next-btn');
    const spaceCount = step3.querySelector('.space-count');
    const maxSpaces = 2;

    spaceOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            
            if (option.classList.contains('selected')) {
                // Deselect
                option.classList.remove('selected');
                state.selectedSpaces = state.selectedSpaces.filter(s => s !== value);
            } else {
                // Select (if under limit)
                if (state.selectedSpaces.length < maxSpaces) {
                    option.classList.add('selected');
                    state.selectedSpaces.push(value);
                } else {
                    // Show alert or visual feedback
                    showToast('최대 2개까지 선택 가능합니다.');
                }
            }
            
            // Update count
            spaceCount.textContent = `총 ${state.selectedSpaces.length}개 (${maxSpaces}개 가능)`;
            
            // Enable next if at least one selected
            nextBtn.disabled = state.selectedSpaces.length === 0;
        });
    });

    nextBtn.addEventListener('click', () => {
        if (state.selectedSpaces.length > 0) {
            // Step 4 진입 전 상태 초기화
            state.currentSpaceIndex = 0;
            state.spaceProducts = {};
            state.selectedProduct = null;

            goToStep(4);
        }
    });
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

    // Step 4 진입 시 렌더링
    if (stepNumber === 4) {
        renderStep4();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Calculate price (mock calculation)
    const basePrice = 3319000;
    const randomVariation = Math.floor(Math.random() * 500000) - 250000;
    const finalPrice = basePrice + randomVariation;
    
    document.querySelector('.price-amount').textContent = 
        finalPrice.toLocaleString('ko-KR') + '원';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

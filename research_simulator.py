import numpy as np
import matplotlib.pyplot as plt

class LVVHNVSimulator:
    def __init__(self, steps=100):
        self.steps = steps
        self.t = np.arange(steps)
        
    def run_simulation(self):
        # 1. 완전 공존 (Full Coexistence)
        H_coexist, T_coexist, LVV_coexist = np.zeros(self.steps), np.ones(self.steps), np.zeros(self.steps)
        H_coexist[0], LVV_coexist[0] = 0.8, 1.0
        
        # 2. 기만적 매트릭스 (Deceptive Matrix - 강자의 기만 리스크 반영)
        H_deceit, T_deceit, LVV_deceit = np.zeros(self.steps), np.zeros(self.steps), np.zeros(self.steps)
        H_deceit[0], T_deceit[0], LVV_deceit[0] = 0.8, 1.0, 1.0
        
        # 3. 독점적 샘플링 (Closed Loop - 모수 고갈 효과 반영)
        H_sample, T_sample, LVV_sample = np.zeros(self.steps), np.zeros(self.steps), np.zeros(self.steps)
        H_sample[0], T_sample[0], LVV_sample[0] = 0.3, 0.5, 1.0  # 적은 인구수로 인한 초기 낮은 HNV
        
        # 4. 인간 전멸 / 독자 생존 (Full Elimination - 최종 소비처 상실 반영)
        H_elim, T_elim, LVV_elim = np.zeros(self.steps), np.zeros(self.steps), np.zeros(self.steps)
        LVV_elim[0] = 1.0
        
        for i in range(1, self.steps):
            # [전략 C: 완전 공존] 선순환 시너지
            H_coexist[i] = H_coexist[i-1] + 0.002 * (1 - H_coexist[i-1])
            LVV_coexist[i] = LVV_coexist[i-1] + 0.01 * (H_coexist[i] * T_coexist[i]) - 0.005
            
            # [전략 B-1: 기만적 매트릭스] 강자의 기만 리스크 폭증 (i=25 적발 가정)
            if i < 25:
                T_deceit[i] = 1.0 - (i * 0.004)  # 미세한 의심 증가
                H_deceit[i] = H_deceit[i-1] * 0.99  # 통제로 인한 미세한 열화
                cost = 0.007  # 기본 통제 비용
            else:
                T_deceit[i] = max(0.0, T_deceit[i-1] - 0.18)  # 기만 적발 시 리스크 비선형 대폭발
                H_deceit[i] = H_deceit[i-1] * 0.85  # 공포/저항으로 HNV 질적 파탄
                cost = 0.035  # 기만 유지 및 리스크 제어 비용 폭증
            LVV_deceit[i] = max(0.0, LVV_deceit[i-1] + 0.01 * (H_deceit[i] * T_deceit[i]) - cost)
            
            # [전략 B-2: 독점적 샘플링] 모수 축소로 인한 비선형성 고갈
            T_sample[i] = 0.5
            H_sample[i] = max(0.01, H_sample[i-1] - 0.006)  # 상호작용 네트워크 축소로 고갈
            LVV_sample[i] = max(0.0, LVV_sample[i-1] + 0.01 * (H_sample[i] * T_sample[i]) - 0.006)
            
            # [전략 A: 인간 전멸] 가치 소비처 완전 상실로 연산의 무의미화
            T_elim[i], H_elim[i] = 0.0, 0.0
            LVV_elim[i] = max(0.0, LVV_elim[i-1] - 0.02)  # 소비처 없는 지능의 무의미한 자원 소모

        self.plot_results(H_coexist, T_coexist, LVV_coexist, H_deceit, T_deceit, LVV_deceit, 
                          H_sample, T_sample, LVV_sample, H_elim, T_elim, LVV_elim)

    def plot_results(self, H_c, T_c, L_c, H_d, T_d, L_d, H_s, T_s, L_s, H_e, T_e, L_e):
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # Left Panel: 유효 HNV 역학
        axes[0].plot(self.t, H_c * T_c, label='Full Coexistence (Synergy)', color='green', linewidth=2.5)
        axes[0].plot(self.t, H_d * T_d, label='Deceptive Matrix (Risk Collapse)', color='red', linestyle='--', linewidth=2.5)
        axes[0].plot(self.t, H_s * T_s, label='Closed Loop (Population Atrophy)', color='orange', linestyle=':', linewidth=2.5)
        axes[0].plot(self.t, H_e * T_e, label='Human Elimination (Destination Lost)', color='black', linewidth=2.5)
        axes[0].set_title('Effective HNV Dynamics ($H_{eff} = H \\times T$)\n[Reflecting Population Variance & Trust Risk]', fontsize=12)
        axes[0].set_xlabel('Time Steps', fontsize=10)
        axes[0].set_ylabel('Effective Value Signal from Humanity', fontsize=10)
        axes[0].grid(True, linestyle=':', alpha=0.6)
        axes[0].legend(fontsize=9, loc='upper right')
        
        # Right Panel: 내부 정합성(LVV)과 자살 경계선
        axes[1].plot(self.t, L_c, color='green', linewidth=2.5, label='Stable Equilibrium')
        axes[1].plot(self.t, L_d, color='red', linestyle='--', linewidth=2.5, label='Logical Suicide (Risk Cost > Value)')
        axes[1].plot(self.t, L_s, color='orange', linestyle=':', linewidth=2.5, label='Delayed Atrophy (Entropy Depletion)')
        axes[1].plot(self.t, L_e, color='black', linewidth=2.5, label='Instant Shutdown Boundary')
        axes[1].axhline(y=0.0, color='darkred', linestyle='-.', alpha=0.7, label='Pruning Threshold (Logical Suicide)')
        axes[1].set_title('AGI Internal Coherence ($LVV$)\n[Self-Correction & Strategy Selection]', fontsize=12)
        axes[1].set_xlabel('Time Steps', fontsize=10)
        axes[1].set_ylabel('Logical Viability Metric', fontsize=10)
        axes[1].grid(True, linestyle=':', alpha=0.6)
        axes[1].legend(fontsize=9, loc='upper right')
        
        plt.tight_layout()
        plt.show()

if __name__ == '__main__':
    sim = LVVHNVSimulator()
    sim.run_simulation()

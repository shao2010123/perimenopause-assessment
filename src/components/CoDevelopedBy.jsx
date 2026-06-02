function WehealLogo() {
  return (
    <svg viewBox="0 0 360 96" className="h-12 w-auto sm:h-14" aria-hidden="true">
      <text
        x="2"
        y="60"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="36"
        letterSpacing="0.5"
        fill="#33467D"
      >
        WEHEAL
      </text>
      <path
        d="M160 10c8 5 10 12 8 18-2 6-9 10-11 16-2 6 2 11 7 16 5 5 8 11 7 19-1 8-5 14-5 21"
        fill="none"
        stroke="#0E9AA7"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M166 8c-2 11-10 14-15 20-5 6-4 13 2 18 5 4 9 9 8 16-1 8-5 14-4 24 1 6 4 10 4 16"
        fill="none"
        stroke="#0E9AA7"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M148 46c6 4 11 7 13 15 2 10 0 20 0 31"
        fill="none"
        stroke="#0E9AA7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="184" y="47" width="14" height="4.5" rx="2.25" fill="#0E9AA7" />
      <text
        x="202"
        y="60"
        fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif"
        fontSize="27"
        letterSpacing="1.5"
        fill="#33467D"
      >
        沃 医 健 康
      </text>
    </svg>
  );
}

function BenaiLogo() {
  return (
    <svg viewBox="0 0 380 96" className="h-11 w-auto sm:h-12" aria-hidden="true">
      <path
        d="M24 18h12a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H24z"
        fill="#2D215A"
      />
      <path
        d="M44 18h15c11 0 19 7 19 17 0 8-5 13-12 15 9 2 15 8 15 17 0 12-9 19-23 19H44z"
        fill="#2D215A"
      />
      <path
        d="M74 50c10 0 12-14 21-14s12 27 22 27 12-35 23-35 12 35 23 35"
        fill="none"
        stroke="#C31991"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M166 54c0-4 3-7 7-7 3 0 5 1 7 4 2-3 4-4 7-4 4 0 7 3 7 7 0 7-6 11-14 17-8-6-14-10-14-17z"
        fill="#E1188E"
      />
      <text
        x="214"
        y="60"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="34"
        letterSpacing="4"
        fontWeight="700"
        fill="#111111"
      >
        BENAI
      </text>
    </svg>
  );
}

function BrandTile({ children, label }) {
  return (
    <div
      className="flex min-h-[88px] items-center justify-center rounded-[18px] px-4 py-4 sm:min-h-[96px] sm:px-5"
      style={{
        background: 'rgba(255,255,255,0.58)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.38)',
      }}
      aria-label={label}
    >
      {children}
    </div>
  );
}

function CoDevelopedBy() {
  return (
    <section className="px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="space-y-3 rounded-[22px] border border-white/40 bg-white/38 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-5">
        <p className="text-center text-[12px] font-medium tracking-[0.08em] text-[#7B6B8A] sm:text-[13px]">
          由沃医健康与本爱医疗共同研发
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <BrandTile label="沃医健康">
            <WehealLogo />
          </BrandTile>
          <BrandTile label="本爱医疗 Benai">
            <BenaiLogo />
          </BrandTile>
        </div>
      </div>
    </section>
  );
}

export default CoDevelopedBy;

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        graphite: '#242424',
        paper: '#f6f3ee',
        porcelain: '#fbfaf7',
        line: '#e7e1d8',
        bronze: '#9a6a32',
        olive: '#596248',
        clay: '#b85c38',
        mist: '#eef2f0',
        success: '#18794e',
        danger: '#b42318'
      },
      boxShadow: {
        soft: '0 24px 70px rgba(17, 17, 17, 0.10)',
        lift: '0 18px 38px rgba(17, 17, 17, 0.14)'
      }
    }
  },
  plugins: []
};

import { useEffect, useState } from 'react';
import { initWorld } from './three/World';
import { spawnObject, addBlock, deleteModel, setWeather } from './three/buttonInteract';
import { environmentManager } from './three/environment';

function App() {
  const [activeCategory, setActiveCategory] = useState<'ANIMALS' | 'NATURE' | 'PROPS' | 'BLDG'>('ANIMALS');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    initWorld();
    
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // 키보드 이벤트 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.key) {
        // 계절 변경 (1, 2, 3, 4)
        case '1':
          environmentManager.setSeason('spring');
          console.log('🌸 Spring');
          break;
        case '2':
          environmentManager.setSeason('summer');
          console.log('☀️ Summer');
          break;
        case '3':
          environmentManager.setSeason('autumn');
          console.log('🍂 Autumn');
          break;
        case '4':
          environmentManager.setSeason('winter');
          console.log('❄️ Winter');
          break;
        // 날씨 변경 (q, w, e, r, t)
        case 'q':
        case 'Q':
          environmentManager.setWeather('sunny');
          console.log('☀️ Sunny');
          break;
        case 'w':
        case 'W':
          environmentManager.setWeather('cloudy');
          console.log('☁️ Cloudy');
          break;
        case 'e':
        case 'E':
          environmentManager.setWeather('rainy');
          console.log('🌧️ Rainy');
          break;
        case 'r':
        case 'R':
          // 'r' 키가 회전에도 사용되므로 gridModels에서 처리됨
          // 여기서는 무시
          break;
        case 't':
        case 'T':
          environmentManager.setWeather('stormy');
          console.log('⛈️ Stormy');
          break;
        // 시간 변경 (n, d)
        case 'n':
        case 'N':
          environmentManager.setNightMode();
          console.log('🌙 Night');
          break;
        case 'd':
        case 'D':
          environmentManager.setDayMode();
          console.log('🌞 Day');
          break;
        // 지형 확장 (Space)
        case ' ':
          event.preventDefault();
          addBlock();
          console.log('🏗️ Terrain expanded');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const styles = {
    container: {
      position: 'absolute' as const,
      right: '20px',
      top: '20px',
      width: '320px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '15px',
      color: 'white',
      fontFamily: "'Inter', sans-serif",
    },
    glassPanel: {
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(12px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '20px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    },
    header: {
      textAlign: 'center' as const,
    },
    time: {
      fontSize: '32px',
      fontWeight: '600',
      marginBottom: '5px',
    },
    date: {
      fontSize: '14px',
      opacity: 0.8,
      marginBottom: '15px',
    },
    weatherRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px'
    },
    weatherBtn: {
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '10px',
        padding: '10px',
        cursor: 'pointer',
        color: 'white',
        flex: 1,
        margin: '0 5px',
        textAlign: 'center' as const
    },
    sectionTitle: {
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        marginBottom: '10px',
        opacity: 0.9,
        textTransform: 'uppercase' as const
    },
    tabs: {
        display: 'flex',
        gap: '5px',
        marginBottom: '15px'
    },
    tab: (active: boolean) => ({
        flex: 1,
        padding: '10px 5px',
        background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        border: 'none',
        borderRadius: '10px',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textAlign: 'center' as const
    }),
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px'
    },
    itemBtn: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        background: 'rgba(255,255,255,0.9)',
        border: 'none',
        borderRadius: '12px',
        padding: '10px',
        cursor: 'pointer',
        color: '#333',
        height: '80px',
        justifyContent: 'center'
    },
    itemIcon: {
        fontSize: '24px',
        marginBottom: '5px'
    },
    itemLabel: {
        fontSize: '10px',
        fontWeight: 'bold'
    },
    footerBtns: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    actionBtn: {
        flex: 1,
        padding: '12px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: '600'
    }
  };

  const renderGridItems = () => {
    switch(activeCategory) {
        case 'ANIMALS':
            return (
                <>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Cow')}>
                        <span style={styles.itemIcon}>🐮</span>
                        <span style={styles.itemLabel}>Cow</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Pig')}>
                        <span style={styles.itemIcon}>🐷</span>
                        <span style={styles.itemLabel}>Pig</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Sheep')}>
                        <span style={styles.itemIcon}>🐑</span>
                        <span style={styles.itemLabel}>Sheep</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Chicken')}>
                        <span style={styles.itemIcon}>🐔</span>
                        <span style={styles.itemLabel}>Hen</span>
                    </button>
                </>
            );
        case 'NATURE':
            return (
                <>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Tree')}>
                        <span style={styles.itemIcon}>🌳</span>
                        <span style={styles.itemLabel}>Tree</span>
                    </button>
                     <button style={styles.itemBtn} onClick={() => spawnObject('Pine')}>
                        <span style={styles.itemIcon}>🌲</span>
                        <span style={styles.itemLabel}>Pine</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Rock')}>
                        <span style={styles.itemIcon}>🪨</span>
                        <span style={styles.itemLabel}>Rock</span>
                    </button>
                     <button style={styles.itemBtn} onClick={() => spawnObject('SRock')}>
                        <span style={styles.itemIcon}>🌑</span>
                        <span style={styles.itemLabel}>Pebble</span>
                    </button>
                </>
            );
        case 'PROPS':
             return (
                <>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Hay')}>
                        <span style={styles.itemIcon}>🌾</span>
                        <span style={styles.itemLabel}>Hay</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Carrot')}>
                        <span style={styles.itemIcon}>🥕</span>
                        <span style={styles.itemLabel}>Carrot</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Potato')}>
                        <span style={styles.itemIcon}>🥔</span>
                        <span style={styles.itemLabel}>Potato</span>
                    </button>
                     <button style={styles.itemBtn} onClick={() => spawnObject('Path')}>
                        <span style={styles.itemIcon}>🛤️</span>
                        <span style={styles.itemLabel}>Path</span>
                    </button>
                </>
            );
        case 'BLDG':
             return (
                <>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Fence')}>
                        <span style={styles.itemIcon}>🚧</span>
                        <span style={styles.itemLabel}>Fence</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Barn')}>
                        <span style={styles.itemIcon}>🏠</span>
                        <span style={styles.itemLabel}>Barn</span>
                    </button>
                    <button style={styles.itemBtn} onClick={() => spawnObject('Windmill')}>
                        <span style={styles.itemIcon}>🌬️</span>
                        <span style={styles.itemLabel}>Mill</span>
                    </button>
                </>
            );
    }
  }

  return (
    <>
      <div id="scene-container"></div>
      
      <div className="ui-layer">
        <div style={styles.container}>
            
            {/* Weather & Time Panel */}
            <div style={styles.glassPanel}>
                 <div style={styles.weatherRow}>
                    <button style={styles.weatherBtn} onClick={() => setWeather('sunny')}>☀️</button>
                    <button style={styles.weatherBtn} onClick={() => setWeather('cloudy')}>☁️</button>
                    <button style={styles.weatherBtn} onClick={() => setWeather('rainy')}>🌧️</button>
                    <button style={styles.weatherBtn} onClick={() => setWeather('night')}>🌙</button>
                 </div>
                
                <div style={styles.header}>
                    <div style={styles.time}>{time.toLocaleTimeString()}</div>
                    <div style={styles.date}>{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div style={{display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '14px', opacity: 0.9}}>
                        <span>20°C</span>
                        <span>Humidity 80%</span>
                    </div>
                </div>
            </div>

            {/* Object Selection */}
            <div style={styles.glassPanel}>
                <div style={styles.sectionTitle}>OBJECTS</div>
                <div style={styles.tabs}>
                    {['ANIMALS', 'NATURE', 'PROPS', 'BLDG'].map(cat => (
                        <button 
                            key={cat} 
                            style={styles.tab(activeCategory === cat)}
                            onClick={() => setActiveCategory(cat as any)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div style={styles.grid}>
                    {renderGridItems()}
                </div>
            </div>

            {/* Global Settings */}
            <div style={styles.glassPanel}>
                <div style={styles.sectionTitle}>GLOBAL SETTINGS</div>
                <div style={styles.footerBtns}>
                     <button style={styles.actionBtn} onClick={deleteModel}>
                        ✕ DELETE MODE
                     </button>
                     <button style={styles.actionBtn} onClick={addBlock}>
                        + EXPAND
                     </button>
                </div>
            </div>

        </div>
      </div>
    </>
  )
}

export default App

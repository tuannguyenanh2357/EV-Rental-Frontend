import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChargingStationService } from '../../services/charging-station';
import { ChargingStation } from '../../models/charging-station';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  private map: any;
  private userMarker: any;
  private L: any;
  
  stations = signal<ChargingStation[]>([]);
  isLoading = signal<boolean>(true);
  isError = signal<boolean>(false);
  private hasUserLocation = false;
  private currentRoute: any = null;
  showClearRoute = signal<boolean>(false);
  routeInfo = signal<string>('');
  
  isBrowser: boolean;

  // Search
  searchQuery = '';
  isSearching = false;
  searchError = '';

  constructor(
    private chargingStationService: ChargingStationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadStations();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        import('leaflet').then(L => {
          this.L = L;
          this.initMap(L);
          this.locateUser(L);
        });
      }, 100);
    }
  }

  // ─── Init Map ────────────────────────────────────────────────────────────────
  private initMap(L: any): void {
    this.map = L.map('leaflet-map', { zoomControl: true }).setView([16.047079, 108.20623], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Allow user to set their exact location by clicking on the map
    this.map.on('click', (e: any) => {
      this.setUserLocation(e.latlng.lat, e.latlng.lng, 'Vị trí bạn đã chọn');
    });

    this.addMarkersToMap();
  }

  // ─── Load Data ───────────────────────────────────────────────────────────────
  private loadStations(): void {
    console.log('Fetching charging stations...');
    this.chargingStationService.getStations().subscribe({
      next: (response) => {
        console.log('Stations fetched successfully:', response);
        this.isLoading.set(false);
        if (response && response.data) {
          this.stations.set(response.data);
          this.addMarkersToMap();
        }
      },
      error: (error) => {
        console.error('Error fetching stations:', error);
        this.isLoading.set(false);
        this.isError.set(true);
      }
    });
  }

  // ─── Station Markers ─────────────────────────────────────────────────────────
  private createStationIcon(L: any) {
    return L.divIcon({
      html: `<div class="station-icon">⚡</div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22]
    });
  }

  private addMarkersToMap(): void {
    const currentStations = this.stations();
    if (!this.map || !this.L || currentStations.length === 0) return;

    const L = this.L;
    const icon = this.createStationIcon(L);
    const markers: any[] = [];

    currentStations.forEach(station => {
      if (station.latitude && station.longitude) {
        const marker = L.marker([station.latitude, station.longitude], { icon }).addTo(this.map);
        markers.push(marker);

        const statusColor = station.isOperational ? '#22c55e' : '#ef4444';
        const statusText = station.isOperational ? '✅ Đang hoạt động' : '🔴 Bảo trì';
        const costText = station.usageCost ? `${station.usageCost} đ/kWh` : 'Miễn phí';

        // Routing button with event listener via popupopen
        const btnId = `route-btn-${station.id}`;
        marker.bindPopup(`
          <div style="min-width:210px; font-family: sans-serif;">
            <div style="background:#1e40af;color:white;padding:10px 12px;margin:-12px -12px 10px -12px;border-radius:4px 4px 0 0;">
              <strong style="font-size:14px;">⚡ ${station.title}</strong>
            </div>
            <p style="margin:4px 0;font-size:12px;color:#555;">📍 ${station.addressLine1}</p>
            <p style="margin:4px 0;font-size:12px;">
              Trạng thái: <span style="color:${statusColor};font-weight:600;">${statusText}</span>
            </p>
            <p style="margin:4px 0;font-size:12px;">💰 Giá sạc: <strong>${costText}</strong></p>
            <button id="${btnId}"
               style="display:block;width:100%;margin-top:10px;padding:8px 0;background:#1e40af;color:white;
                      border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">
              🗺️ Chỉ đường trên bản đồ
            </button>
          </div>
        `, { maxWidth: 280 });

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(btnId);
            if (btn) {
              btn.addEventListener('click', () => {
                this.map.closePopup();
                this.drawRoute(station.latitude, station.longitude, station.title);
              });
            }
          }, 50);
        });
      }
    });

    // Chỉ fitBounds về tất cả trạm khi chưa xác định vị trí người dùng
    if (markers.length > 0 && !this.hasUserLocation) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds().pad(0.15));
    }
  }

  // ─── User Geolocation ────────────────────────────────────────────────────────
  private locateUser(_L: any): void {
    if (!navigator.geolocation) {
      this.fallbackToIpLocation();
      return;
    }

    // Bước 1: Thử ngay bằng WiFi/Network (giống Google Maps, không cần GPS chip)
    // enableHighAccuracy: FALSE → Chrome dùng Google Location Service qua WiFi → nhanh & khá chính xác
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log(`✅ Vị trí tìm được: ${latitude}, ${longitude} (độ chính xác: ${Math.round(accuracy)}m)`);
        this.setUserLocation(latitude, longitude, `📡 Vị trí của bạn (~${Math.round(accuracy)}m)`);
        this.map.setView([latitude, longitude], accuracy < 500 ? 15 : 13);
      },
      (err) => {
        console.warn('Trình duyệt từ chối hoặc lỗi:', err.message);
        this.fallbackToIpLocation();
      },
      {
        enableHighAccuracy: false, // dùng WiFi/Network như Google Maps
        timeout: 15000,
        maximumAge: 0             // không dùng cache, lấy vị trí mới nhất
      }
    );
  }

  private fallbackToIpLocation(): void {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.latitude && data.longitude) {
          this.setUserLocation(data.latitude, data.longitude, `Vị trí gần đúng (${data.city})`);
          this.map.setView([data.latitude, data.longitude], 11);
        }
      })
      .catch(err => console.warn('Lỗi định vị qua IP:', err));
  }

  private setUserLocation(lat: number, lng: number, title: string): void {
    if (!this.L || !this.map) return;
    const L = this.L;

    this.hasUserLocation = true; // đánh dấu đã có vị trí → fitBounds sẽ không ghi đè nữa

    const userIcon = L.divIcon({
      html: `<div class="user-location-icon">📍</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38]
    });

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }
    this.userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup(`<strong>📍 ${title}</strong>`)
      .openPopup();
  }

  // ─── Search ──────────────────────────────────────────────────────────────────
  searchLocation(): void {
    if (!this.searchQuery.trim()) return;
    this.isSearching = true;
    this.searchError = '';

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}&limit=1&accept-language=vi`;

    fetch(url, { headers: { 'Accept-Language': 'vi' } })
      .then(res => res.json())
      .then(results => {
        this.isSearching = false;
        if (results && results.length > 0) {
          const { lat, lon, display_name } = results[0];
          const latlng = [parseFloat(lat), parseFloat(lon)];
          this.map.setView(latlng as any, 15);
          
          this.setUserLocation(latlng[0], latlng[1], display_name);
        } else {
          this.searchError = 'Không tìm thấy địa điểm. Thử từ khoá khác!';
        }
      })
      .catch(() => {
        this.isSearching = false;
        this.searchError = 'Lỗi kết nối, vui lòng thử lại.';
      });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.searchLocation();
  }

  goToMyLocation(): void {
    if (this.L) this.locateUser(this.L);
  }

  // ─── On-map Routing (OSRM) ───────────────────────────────────────────────────
  drawRoute(toLat: number, toLng: number, title: string): void {
    if (!this.userMarker) {
      alert('📍 Vui lòng bật vị trí của bạn trước (nhấn nút 📍 góc trên).');
      return;
    }

    const userPos = this.userMarker.getLatLng();
    const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${toLng},${toLat}?overview=full&geometries=geojson`;

    // Xóa route cũ nếu có
    this.clearRoute();

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.routes || data.routes.length === 0) {
          alert('Không tìm được đường đi.');
          return;
        }

        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

        // Vẽ đường màu xanh lên bản đồ
        this.currentRoute = this.L.polyline(coords, {
          color: '#2563eb',
          weight: 6,
          opacity: 0.85,
          lineJoin: 'round'
        }).addTo(this.map);

        this.map.fitBounds(this.currentRoute.getBounds().pad(0.1));

        const km = (route.distance / 1000).toFixed(1);
        const min = Math.round(route.duration / 60);
        this.routeInfo.set(`🚗 ${km} km · ⏱ ${min} phút đến "${title}"`);
        this.showClearRoute.set(true);
      })
      .catch(() => alert('Lỗi kết nối dịch vụ chỉ đường. Thử lại sau.'));
  }

  clearRoute(): void {
    if (this.currentRoute) {
      this.map.removeLayer(this.currentRoute);
      this.currentRoute = null;
    }
    this.showClearRoute.set(false);
    this.routeInfo.set('');
  }
}

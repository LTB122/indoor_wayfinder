export interface MapModel {
  id?: number;
  name: string;
  image_link: string; // URL của ảnh (từ server hoặc blob local)
  floor_number: number;
  scale: number;      // Tỉ lệ (ví dụ: 1px = 0.5 mét)
}
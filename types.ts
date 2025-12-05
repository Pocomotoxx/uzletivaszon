
export interface CanvasItem {
  id: string;
  text: string;
}

export interface CanvasBlockData {
  id: string;
  title: string;
  description: string;
  color: string;
  items: CanvasItem[];
}

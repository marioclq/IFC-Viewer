// src/app/components/IFCViewer/types.ts
import { Components } from '@thatopen/components'
import * as OBC from '@thatopen/components'
import * as THREE from 'three'

export type ViewerWorld = OBC.SimpleWorld<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>

export interface IFCModel {
  id: string;
  name: string;
  model: THREE.Group; // Cambiado a THREE.Group
}

export interface ViewerState {
  components: Components | null;
  isLoading: boolean;
  error: string | null;
  models: IFCModel[];
  currentWorld: ViewerWorld | null;
}
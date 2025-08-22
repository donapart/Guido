/**
 * Global type declarations for Voice Control
 * Browser APIs and Speech Recognition
 */

// Web Audio API Types
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    speechSynthesis: SpeechSynthesis;
  }

  // Speech Recognition Types (if not already available)
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: SpeechGrammarList;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    serviceURI: string;
    
    abort(): void;
    start(): void;
    stop(): void;
    
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionAlternative {
    readonly confidence: number;
    readonly transcript: string;
  }

  interface SpeechGrammarList {
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }

  // Constructor types
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };

  // MediaDevices types extension
  interface Navigator {
    permissions: Permissions;
    mediaDevices: MediaDevices;
    userAgent: string;
  }

  interface Permissions {
    query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
  }

  interface PermissionDescriptor {
    name: PermissionName;
  }

  interface PermissionStatus extends EventTarget {
    readonly name: PermissionName;
    readonly state: PermissionState;
    onchange: ((this: PermissionStatus, ev: Event) => any) | null;
  }

  type PermissionName = "camera" | "microphone" | "notifications" | "geolocation" | "persistent-storage" | "push" | "screen-wake-lock" | "xr-spatial-tracking";
  type PermissionState = "granted" | "denied" | "prompt";

  // Notification API
  interface NotificationOptions {
    actions?: NotificationAction[];
    badge?: string;
    body?: string;
    data?: any;
    dir?: NotificationDirection;
    icon?: string;
    image?: string;
    lang?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
    timestamp?: number;
    vibrate?: number[];
  }

  interface NotificationAction {
    action: string;
    icon?: string;
    title: string;
  }

  type NotificationDirection = "auto" | "ltr" | "rtl";
  type NotificationPermission = "default" | "denied" | "granted";

  interface Notification extends EventTarget {
    readonly actions: ReadonlyArray<NotificationAction>;
    readonly badge: string;
    readonly body: string;
    readonly data: any;
    readonly dir: NotificationDirection;
    readonly icon: string;
    readonly image: string;
    readonly lang: string;
    readonly renotify: boolean;
    readonly requireInteraction: boolean;
    readonly silent: boolean;
    readonly tag: string;
    readonly timestamp: number;
    readonly title: string;
    readonly vibrate: ReadonlyArray<number>;
    onclick: ((this: Notification, ev: Event) => any) | null;
    onclose: ((this: Notification, ev: Event) => any) | null;
    onerror: ((this: Notification, ev: Event) => any) | null;
    onshow: ((this: Notification, ev: Event) => any) | null;
    close(): void;
  }

  var Notification: {
    prototype: Notification;
    new(title: string, options?: NotificationOptions): Notification;
    readonly maxActions: number;
    readonly permission: NotificationPermission;
    requestPermission(): Promise<NotificationPermission>;
    requestPermission(deprecatedCallback: (permission: NotificationPermission) => void): void;
  };
}

export {};

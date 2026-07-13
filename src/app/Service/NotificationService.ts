import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client, Message } from '@stomp/stompjs';
// @ts-ignore
import SockJS from 'sockjs-client/dist/sockjs';

export interface AppNotification {
  id: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  timeDisplay?: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient!: Client;
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();
  
  private readonly REST_URL = 'http://localhost:8081/api/notifications';
  private readonly WS_URL = 'http://localhost:8081/ws';

  constructor(private http: HttpClient, private zone: NgZone) {
    this.fetchHistory();
    this.connectWebSocket();
  }

  get notifications(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private fetchHistory(): void {
    this.http.get<any[]>(this.REST_URL).subscribe({
      next: (data) => {
        const parsed = data.map(n => this.mapNotification(n)).filter(n => !n.read);
        this.notificationsSubject.next(parsed);
      },
      error: (err) => console.error('Failed to load notification history', err)
    });
  }

  private connectWebSocket(): void {
    this.stompClient = new Client({
      // using sockjs as a fallback via webSocketFactory
      webSocketFactory: () => new SockJS(this.WS_URL),
      debug: (msg: string) => console.log('STOMP: ', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      this.stompClient.subscribe('/topic/notifications', (message: Message) => {
        this.zone.run(() => {
          if (message.body) {
            const raw = JSON.parse(message.body);
            const notif = this.mapNotification(raw);
            if (!notif.read) {
              const current = this.notificationsSubject.value;
              this.notificationsSubject.next([notif, ...current]);
            }
          }
        });
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.activate();
  }

  public markAsRead(id: string): void {
    this.http.put(`${this.REST_URL}/${id}/read`, {}).subscribe({
      next: () => {
        const current = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(current);
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

  public markAllAsRead(): void {
    this.http.put(`${this.REST_URL}/read-all`, {}).subscribe({
      next: () => {
        this.notificationsSubject.next([]);
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  private mapNotification(n: any): AppNotification {
    return {
      id: n.id,
      icon: n.icon || '🔔',
      title: n.title,
      description: n.description,
      timestamp: n.timestamp,
      timeDisplay: this.timeSince(new Date(n.timestamp)),
      read: n.read
    };
  }

  private timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hrs ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "Just now";
  }
}

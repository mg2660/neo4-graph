import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({ selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.css'] }) export class AppComponent implements OnInit { title = 'DSM'; chatWindowOpen = false; messages: { text: string; sender: string }[] = [ { text: "Hello <Customer name>! I'm your dedicated GameX assistant. How can I assist you, today?", sender: "bot" }, ]; newMessage = ''; apiResponse: any; eventDetails: any = {}; awaitingResponse: string | null = null; confirmationShown: boolean = false; processing = false;

@ViewChild('chatBody') chatBody!: ElementRef;

constructor(private http: HttpClient) {}

ngOnInit(): void {}

scrollUp() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

toggleChatWindow() { this.chatWindowOpen = !this.chatWindowOpen; setTimeout(() => this.scrollToBottom(), 100); }

scrollToBottom() { try { this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight; } catch (err) {} }

sendMessage() { if (!this.newMessage.trim()) return;

const userMessage = this.newMessage;
this.messages.push({ text: userMessage, sender: 'user' });
this.newMessage = '';
this.scrollToBottom();

if (/route|path|latency/i.test(userMessage)) {
  this.getBestRoutesFromTopology();
} else {
  // Add your chatbot backend call here (if any)
  this.messages.push({ text: 'Let me connect you to the backend...', sender: 'bot' });
}

}

getBestRoutesFromTopology() { this.processing = true; const topologyApiUrl = 'http://localhost:3000/api/routes'; // Adjust this to match your topology backend route

this.http.get<any>(topologyApiUrl).subscribe({
  next: (data) => {
    this.processing = false;
    if (data.bestPath) {
      this.messages.push({ text: `Best Route: ${data.bestPath.join(' → ')}`, sender: 'bot' });
    }
    if (data.alternatePaths?.length) {
      this.messages.push({ text: `Alternate Routes: ${data.alternatePaths.map((p: any) => p.join(' → ')).join('\n')}`, sender: 'bot' });
    }
    this.scrollToBottom();
  },
  error: (err) => {
    this.processing = false;
    this.messages.push({ text: 'Sorry, I couldn\'t fetch the route info right now.', sender: 'bot' });
    console.error('Error fetching routes:', err);
    this.scrollToBottom();
  }
});

} }


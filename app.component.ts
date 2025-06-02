
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'DSM';
  chatWindowOpen = false;
  messages: { text: string; sender: string }[] = [
    { text: "Hello <Customer name>! I'm your dedicated GameX assistant. How can I assist you, today?", sender: "bot" },
  ];
  newMessage = '';
  apiResponse: any;
  eventDetails: any = {};
  awaitingResponse: string | null = null;
confirmationShown: boolean = false;
  processing = false;

  @ViewChild('chatBody') chatBody!: ElementRef;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  scrollUp() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleChatWindow() {
    this.chatWindowOpen = !this.chatWindowOpen;
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({ text: this.newMessage, sender: "user" });
      if (this.awaitingResponse) {
        this.handleMissingInfo(this.newMessage.trim().toLowerCase());
      } else {
        this.handlePredefinedMessages(this.newMessage.trim().toLowerCase());
      }
      this.newMessage = '';
      this.scrollToBottom();
    }
  }

  handlePredefinedMessages(message: string) {
    let response = '';
    switch (message) {
      case 'hi':
        response = 'Hi there! How can I assist you today?';
        break;
      case 'bye':
        response = 'Goodbye! Have a great day!';
        break;
      case 'how are you':
        response = 'I am just a bot, but I am here to help you!';
        break;
      case 'what is your name':
        response = 'I am GameXBot, your friendly assistant!';
        break;
      case 'help':
        response = 'Sure! I can assist you with gaming, tournaments. What do you need help with?';
        break;
      case 'get intent':
      case 'intent':
      case 'show intent':
        this.getRecentIntent();
        return;
      default:
        this.extractEventDetails(message);
        return;
    }
    this.messages.push({ text: response, sender: "bot" });
    this.scrollToBottom();
  }

  extractEventDetails(message: string) {
    const locationRegex = /(?:in|on|at)\s+([a-zA-Z\s]+)/i;
    const dateRegex = /(\d{1,2}(?:st|nd|rd|th)?(?:\s+|\/|-)(?:[a-zA-Z]+|\d{1,2})(?:\s+|\/|-)\d{4})/gi;
    const playerCountRegex = /(?:for|with)\s+(\d+)\s+players?/i;

    const locationMatch = message.match(locationRegex);
    const dateMatches = message.match(dateRegex);
    const playerCountMatch = message.match(playerCountRegex);

    if (locationMatch) {
      const location = locationMatch[1].trim();
      if (location.toLowerCase() !== 'riyadh') {
        this.awaitingResponse = null;
        this.messages.push({
          text: "Sorry! Currently we are not available in this location.",
          sender: "bot"
        });
        this.scrollToBottom();
        return;
      }
      this.eventDetails.location = location;
    }

    if (dateMatches && dateMatches.length >= 2) {
      this.eventDetails.startDate = this.formatDateToDDMMYYYY(dateMatches[0]);
      this.eventDetails.endDate = this.formatDateToDDMMYYYY(dateMatches[1]);
    } else if (dateMatches && dateMatches.length === 1) {
      if (!this.eventDetails.startDate) {
        this.eventDetails.startDate = this.formatDateToDDMMYYYY(dateMatches[0]);
      } else if (!this.eventDetails.endDate) {
        this.eventDetails.endDate = this.formatDateToDDMMYYYY(dateMatches[0]);
      }
    }

    if (playerCountMatch) {
      this.eventDetails.playerCount = playerCountMatch[1];
    }

    if (!this.eventDetails.location) {
      this.awaitingResponse = 'location';
      this.messages.push({
        text: "Understood. You're looking to host a gaming event. To ensure we set up everything perfectly, could you please confirm the primary location for your event?",
        sender: "bot"
      });
    } else if (!this.eventDetails.startDate && !this.eventDetails.endDate) {
      this.awaitingResponse = 'startAndEndDate';
      this.messages.push({
        text: "Excellent! Riyadh it is. Now, to help us provision the ideal network slice, what is the start date for your event, and when will it conclude? Please provide both (e.g., DD/MM/YYYY - DD/MM/YYYY)",
        sender: "bot"
      });
    } else if (!this.eventDetails.startDate) {
      this.awaitingResponse = 'startDate';
      this.messages.push({
        text: "Thanks! Now, could you please provide the start date for the event?",
        sender: "bot"
      });
    } else if (!this.eventDetails.endDate) {
      this.awaitingResponse = 'endDate';
      this.messages.push({
        text: "Got it. Could you now provide the end date for the event?",
        sender: "bot"
      });
    } else if (!this.eventDetails.playerCount) {
      this.awaitingResponse = 'playerCount';
      this.messages.push({
        text: "Could you tell me the estimated number of players you anticipate at peak?",
        sender: "bot"
      });
    } else {
      // Generate confirmation message
      const confirmationMessage = `Alright, let's confirm your request:
• Event Type: Gaming Event
• Location: ${this.eventDetails.location}
• Dates: ${this.eventDetails.startDate} - ${this.eventDetails.endDate}
• Estimated Players: ${this.eventDetails.playerCount}
Does this sound correct to you?`;

      // Add bot confirmation message
      this.messages.push({ sender: 'GameX Assistant', text: confirmationMessage });
this.confirmationShown = true;

      // Send to API
      this.awaitingResponse = 'confirmation';
    }

    this.scrollToBottom();
  }

  handleMissingInfo(userInput: string) {
    if (!this.awaitingResponse) return;

    const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
    const dates = userInput.match(dateRegex);

    switch (this.awaitingResponse) {
      case 'confirmation':
        if (userInput.toLowerCase() === 'yes') {
          this.awaitingResponse = null;

          // First message
          this.messages.push({
            text: "Fantastic! Just a moment while our system quickly performs a feasibility check and reserves the necessary network resources. This ensures we can deliver the ultra-low latency and high bandwidth your event demands.",
            sender: "GameX Assistant"
          });
          this.scrollToBottom();

          // Second message after 10 seconds
          setTimeout(() => {
            this.messages.push({
              text: "Great news! The network capacity is available, and your request can be fulfilled. For rapid activation, we can provision these services live for your event. Do you confirm you're ready to place the order and would you like to pre-activate the request?",
              sender: "GameX Assistant"
            });
            this.awaitingResponse = 'finalConfirmation'; // Wait for final yes
            this.scrollToBottom();
          }, 10000);
        } else {
          this.messages.push({ text: "Please provide the correct details.", sender: "bot" });
          this.awaitingResponse = null;
        }
        break;

      case 'finalConfirmation':
        if (userInput.toLowerCase() === 'yes') {
          this.awaitingResponse = null;
          this.createQuote(); // Proceed to create the quote
        } else {
          this.messages.push({
            text: "No problem! Let me know if you'd like to make any changes or need more time.",
            sender: "GameX Assistant"
          });
          this.awaitingResponse = null;
          this.scrollToBottom();
        }
        break;

      case 'location':
        this.eventDetails.location = userInput;
        break;

      case 'startAndEndDate':
        if (dates && dates.length >= 2) {
          this.eventDetails.startDate = this.formatDateToDDMMYYYY(dates[0]);
          this.eventDetails.endDate = this.formatDateToDDMMYYYY(dates[1]);
          this.awaitingResponse = null;
        } else if (dates && dates.length === 1) {
          this.eventDetails.startDate = this.formatDateToDDMMYYYY(dates[0]);
          this.awaitingResponse = 'endDate';
          this.messages.push({
            text: "Thanks! Now, could you please provide the end date for the event?",
            sender: "bot"
          });
          this.scrollToBottom();
          return;
        } else {
          this.messages.push({
            text: "I couldn't understand the dates. Please provide them in the format DD/MM/YYYY.",
            sender: "bot"
          });
          this.scrollToBottom();
          return;
        }
        break;

      case 'startDate':
        this.eventDetails.startDate = this.formatDateToDDMMYYYY(userInput);
        break;

      case 'endDate':
        this.eventDetails.endDate = this.formatDateToDDMMYYYY(userInput);
        break;

      case 'playerCount':
        this.eventDetails.playerCount = userInput;
        break;
    }

    this.awaitingResponse = null;
    if (!this.confirmationShown) {
this.extractEventDetails('');
}
  }

  formatDateToDDMMYYYY(dateStr: string): string | null {
    const months: { [key: string]: string } = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };

    const parts = dateStr.toLowerCase().replace(/(st|nd|rd|th)/g, '').split(/[\s/-]+/);
    if (parts.length === 3) {
      let [day, month, year] = parts;

      if (isNaN(Number(month))) {
        month = months[month.toLowerCase()];
      }

      if (day.length === 1) day = '0' + day;
      if (month && year && day) {
        return `${day}/${month}/${year}`;
      }
    }

    return null;
  }

  createQuote() {
    const orderId = this.generateRandomId('ORD');
    const requestBody = {
      orderId: orderId,
      queryId: this.generateRandomId('ORDL'),
      location: this.eventDetails.location,
      playerCount: this.eventDetails.playerCount,
      startDate: this.eventDetails.startDate,
      endDate: this.eventDetails.endDate,
      status: "New"
    };

    const headers = new HttpHeaders({
      'Authorization': 'Basic ' + btoa('tmfcatalyst:Cts@2025'),
      'Content-Type': 'application/json'
    });

    this.http.post('/api/api/x_gtsip_agenticai/intentquery/query', requestBody, { headers })
    .subscribe({
      next: () => {
        this.messages.push({
          text: `Thanks, your Order ID is: ${orderId}. Your network services are now being provisioned automatically across our converged fixed, mobile, and cloud domains. Our autonomous network is setting up your dedicated gaming slice right now – aiming for zero-wait and zero-touch delivery.`,
          sender: "GameX Assistant"
        });
        this.scrollToBottom();
        this.getQuoteDetails(orderId); // Fetch quote details after creating the quote
      },
      error: () => {
        this.messages.push({
          text: "Failed to create quote. Please try again later.",
          sender: "bot"
        });
        this.scrollToBottom();
      }
    });
  }

  getQuoteDetails(orderId: string) {
    const headers = new HttpHeaders({
      'Authorization': 'Basic ' + btoa('tmfcatalyst:Cts@2025'),
      'Content-Type': 'application/json'
    });

    this.http.get('/api/api/x_gtsip_agenticai/intentquery/querylast', { headers })
    .subscribe({
      next: (response: any) => {
        const result = response.result;
        const startDate = result.startDate ? this.formatDateToDDMMYYYY(result.startDate) : 'N/A';
        const endDate = result.endDate ? this.formatDateToDDMMYYYY(result.endDate) : 'N/A';
        const status = result.status || 'N/A';
        const location = result.location || 'N/A';

        this.messages.push({
          text: `Success! Your dedicated network for the ${location} gaming event (${startDate} - ${endDate}) is now fully provisioned and active.
• Order ID: ${orderId}
• Activation Status: ${status}
• Event Dates: ${startDate} - ${endDate}`,
          sender: "GameX Assistant"
        });
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({
          text: "Failed to fetch quote details. Please try again later.",
          sender: "bot"
        });
        this.scrollToBottom();
      }
    });
  }

  getRecentIntent() {
    const headers = new HttpHeaders({
      'Authorization': 'Basic ' + btoa('tmfcatalyst:Cts@2025'),
      'Content-Type': 'application/json'
    });

    this.http.get('/api/api/x_gtsip_agenticai/intent_ai/intentrecent', { headers })
    .subscribe({
      next: (response: any) => {
        this.apiResponse = response;
        const intentId = response?.result?.number || 'INT-XXXXX';

        const messages = [
          "Validating your intent...Hang tight! We're making sure everything checks out. ✅",
          "Provisioning your intent into the network...We're setting things up behind the scenes. Almost there! ⚙️",
          "Intent successfully provisioned! Everything is in place and ready to go.",
          "Your intent is now live and ready for service! You're all set to dive in.",
          `Intent ID: ${intentId} Success! Your intent is active and ready to use.`,
          "Enjoy your gaming experience! Let the fun begin! 🎮🔥",
          "Need anything else? I'm here to help—just say the word!"
        ];

        this.displayMessagesWithDelay(messages, 10000); // 10 seconds delay
      },
      error: () => {
        this.messages.push({ text: "Failed to fetch recent intent. Please try again later.", sender: "bot" });
        this.scrollToBottom();
      }
    });
  }

  displayMessagesWithDelay(messages: string[], delay: number) {
    this.processing = true;
    this.scrollToBottom();

    messages.forEach((msg, index) => {
      setTimeout(() => {
        if (index === messages.length - 1) {
          this.processing = false;
        }
        this.messages.push({ text: msg, sender: "bot" });
        this.scrollToBottom();
      }, delay * index);
    });
  }

  generateRandomId(prefix: string): string {
    return `${prefix}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  formatMessage(text: string): string {
    return text;
  }

  scrollToBottom() {
    try {
      setTimeout(() => {
        if (this.chatBody && this.chatBody.nativeElement) {
          this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }
}

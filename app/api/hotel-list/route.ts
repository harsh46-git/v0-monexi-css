import { NextResponse } from "next/server";

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || "GhXW2e1SI7sALsAkyII5jE0ZpOGIaKin";
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || "rSfpk3GhU0xlzzcI";



const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", // Luxury Pool
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", // Modern Exterior
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", // Cozy Room
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", // Suite
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80", // Resort
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", // Beach Hotel
];

// Helper to get a random image
const getRandomImage = (index: number) => HOTEL_IMAGES[index % HOTEL_IMAGES.length];

// 🌍 MASSIVE INDIAN HOTEL DATABASE (Backup for 28 States & UTs)
const INDIAN_HOTELS_DB: any = {
  // --- NORTH INDIA ---
  "DEL": [ // Delhi
    { name: "Taj Palace", price: 14500 }, { name: "The Oberoi", price: 18000 }, { name: "Radisson Blu Plaza", price: 7500 },
    { name: "Ibis Aerocity", price: 4200 }, { name: "The Leela Palace", price: 21000 }, { name: "Shangri-La Eros", price: 11000 },
    { name: "Hyatt Regency", price: 9500 }, { name: "Holiday Inn", price: 5500 }, { name: "Lemon Tree Premier", price: 4800 },
    { name: "Roseate House", price: 12500 }
  ],
  "JAI": [ // Jaipur (Rajasthan)
    { name: "Rambagh Palace", price: 35000 }, { name: "Fairmont Jaipur", price: 16000 }, { name: "ITC Rajputana", price: 9500 },
    { name: "Hilton Jaipur", price: 7200 }, { name: "Radisson Jaipur City Center", price: 5500 }, { name: "Lemon Tree Premier", price: 4500 },
    { name: "The Lalit Jaipur", price: 8500 }, { name: "Marriott Hotel", price: 9000 }, { name: "Holiday Inn City Centre", price: 4800 },
    { name: "Royal Orchid", price: 4200 }
  ],
  "DED": [ // Dehradun (Uttarakhand)
    { name: "Hyatt Regency", price: 12500 }, { name: "Ramada Dehradun", price: 6800 }, { name: "Hotel Madhuban", price: 5500 },
    { name: "LP Vilas", price: 8500 }, { name: "Lemon Tree Hotel", price: 5900 }, { name: "Seyfert Sarovar Premiere", price: 6200 },
    { name: "Four Points by Sheraton", price: 7500 }, { name: "Hotel Pacific", price: 4200 }, { name: "The Solitaire", price: 4800 },
    { name: "Effotel by Sayaji", price: 5100 }
  ],
  "PAT": [ // Patna (Bihar)
    { name: "Hotel Maurya", price: 6500 }, { name: "Lemon Tree Premier", price: 5200 }, { name: "Hotel Patliputra Ashok", price: 3500 },
    { name: "Gargee Grand", price: 4800 }, { name: "Amali Inn", price: 4200 }, { name: "Hotel Panache", price: 4500 },
    { name: "Hotel Chanakya", price: 5500 }, { name: "Ginger Patna", price: 3200 }, { name: "Hotel Avasara", price: 2800 },
    { name: "Red Velvet Hotel", price: 3800 }
  ],
  "GOI": [ // Goa
    { name: "Taj Fort Aguada", price: 22000 }, { name: "W Goa", price: 18000 }, { name: "Hard Rock Hotel", price: 9500 },
    { name: "Novotel Goa Resort", price: 7500 }, { name: "Ibis Styles", price: 4500 }, { name: "The Lalit Golf & Spa", price: 16000 },
    { name: "Alila Diwa", price: 14500 }, { name: "Hyatt Centric", price: 8500 }, { name: "Fairfield by Marriott", price: 5200 },
    { name: "Sterling Goa", price: 4800 }
  ],
};

// 🛠️ HELPER: Generate Generic Hotels
const generateGenericHotels = (cityCode: string) => {
  const brands = ["Grand", "Royal", "City Center", "Plaza", "Residency", "View", "Palace", "Inn", "Elite", "Comfort"];
  const suffix = ["Hotel", "Suites", "Resort", "Stay", "Lodge"];
  
  return Array.from({ length: 10 }, (_, i) => ({
    name: `The ${cityCode} ${brands[i]} ${suffix[i % suffix.length]}`,
    price: 3000 + (i * 800),
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    image: getRandomImage(i), // 📸 Add Image
    amenities: ["Free WiFi", "Breakfast", "AC"]
  }));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityCode = searchParams.get("city") || "DEL"; 

  // 1. AUTH TOKEN
  const getAuthToken = async () => {
    try {
      const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
      });
      const data = await res.json();
      return data.access_token;
    } catch (e) { return null; }
  };

  try {
    const token = await getAuthToken();
    let finalHotels = [];

    // 2. TRY REAL API FIRST
    if (token) {
      const url = `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=20&radiusUnit=KM&page[limit]=12`;
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        // Real Data Process Karo
        finalHotels = data.data.map((h: any, i: number) => ({
          id: h.hotelId,
          name: h.name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, (l: string) => l.toUpperCase()),
          rating: (Math.random() * (5.0 - 3.8) + 3.8).toFixed(1),
          price: Math.floor(Math.random() * (12000 - 3500) + 3500),
          image: getRandomImage(i), // 📸 Add Image Here
          amenities: ["WiFi", "Pool", "Spa", "Gym", "Bar"].sort(() => 0.5 - Math.random()).slice(0, 3)
        }));
      }
    }

    // 3. FALLBACK: USE BACKUP DB
    if (finalHotels.length === 0) {
      const backupList = INDIAN_HOTELS_DB[cityCode];
      if (backupList) {
        finalHotels = backupList.map((h: any, i: number) => ({
          id: `backup-${cityCode}-${i}`,
          name: h.name,
          rating: (4.0 + Math.random()).toFixed(1),
          price: h.price,
          image: getRandomImage(i), // 📸 Add Image Here
          amenities: ["Free WiFi", "Breakfast", "Restaurant", "Parking"].sort(() => 0.5 - Math.random()).slice(0, 3)
        }));
      } else {
        finalHotels = generateGenericHotels(cityCode).map((h:any, i:number) => ({
          id: `gen-${i}`,
          ...h
        }));
      }
    }

    finalHotels.sort((a:any, b:any) => a.price - b.price);
    return NextResponse.json({ hotels: finalHotels });

  } catch (error) {
    return NextResponse.json({
      hotels: generateGenericHotels(cityCode).map((h:any, i:number) => ({ id: `err-${i}`, ...h }))
    });
  }
}
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ClipboardList, Home as HomeIcon, Menu, Minus, Plus, ShoppingBag, ShoppingCart, Sparkles, Trash2, UserRound, X, BookOpen } from "lucide-react";

type Product = { id: number; name: string; description: string; price: number; category: string; image: string; badge?: string; featured?: boolean; hidden?: boolean; availableFrom?: string; availableTo?: string; options?: string[] };
type CartItem = Product & { qty: number; choices?: string[] };
export const defaultProducts: Product[] = [
  {
    "id": 1,
    "name": "فلافل",
    "description": "",
    "price": 0.1,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 2,
    "name": "مشكل",
    "description": "",
    "price": 0.1,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 3,
    "name": "فول",
    "description": "",
    "price": 0.1,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 4,
    "name": "مشكل فلافل مع حمص",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 5,
    "name": "مشكل فلافل خبز",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 6,
    "name": "مسقعة",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 7,
    "name": "عجة",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 8,
    "name": "عجة بطاط",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 9,
    "name": "بطاط",
    "description": "",
    "price": 0.1,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 10,
    "name": "بطاط كاتشب مايونيز",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 11,
    "name": "بطاط باذنجان خبز",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 12,
    "name": "صمون حمص سلطة",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 13,
    "name": "صمون حمص بطاط سلطة",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 14,
    "name": "بيض بالطماطم",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 15,
    "name": "بيض بالطماطم والبطاط",
    "description": "",
    "price": 0.15,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 16,
    "name": "لبنة كامل",
    "description": "",
    "price": 0.3,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 17,
    "name": "جبن أبيض",
    "description": "",
    "price": 0.35,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 18,
    "name": "كيس صمون 10 حبات",
    "description": "",
    "price": 0.35,
    "category": "السندويشات الخفيفة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 19,
    "name": "شاورما لحم",
    "description": "",
    "price": 0.65,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 20,
    "name": "شاورما دجاج",
    "description": "",
    "price": 0.65,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 21,
    "name": "كباب",
    "description": "",
    "price": 0.6,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 22,
    "name": "شيش طاووق",
    "description": "",
    "price": 0.6,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 23,
    "name": "كفتة بالصلصة",
    "description": "",
    "price": 0.5,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 24,
    "name": "كبدة دجاج",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 25,
    "name": "تكا لحم بالطماط",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 26,
    "name": "تكا دجاج بالطماط",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 27,
    "name": "مشروم",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 28,
    "name": "مشروم + جبن",
    "description": "",
    "price": 0.5,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 29,
    "name": "حلوم",
    "description": "",
    "price": 0.5,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 30,
    "name": "طلياني",
    "description": "",
    "price": 0.6,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 31,
    "name": "مسحب",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 32,
    "name": "مرتديلا",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 33,
    "name": "مرتديلا + جبن",
    "description": "",
    "price": 0.5,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 34,
    "name": "مرتديلا + حلوم",
    "description": "",
    "price": 0.6,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 35,
    "name": "تقانق",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 36,
    "name": "تقانق جبن",
    "description": "",
    "price": 0.5,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 37,
    "name": "تقانق بيض",
    "description": "",
    "price": 0.4,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 38,
    "name": "تقانق بيض جبن",
    "description": "",
    "price": 0.5,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 39,
    "name": "صمون لسان",
    "description": "",
    "price": 0.6,
    "category": "السندويشات الحارة والباردة",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 40,
    "name": "فلافل",
    "description": "",
    "price": 0.4,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 41,
    "name": "مشكل مقالي",
    "description": "",
    "price": 0.4,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 42,
    "name": "شاورما دجاج",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 43,
    "name": "شاورما لحم",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 44,
    "name": "كباب",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 45,
    "name": "شيش طاووق",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 46,
    "name": "حلوم",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 47,
    "name": "طلياني",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 48,
    "name": "أجبان بأنواعها",
    "description": "",
    "price": 0.75,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 49,
    "name": "لبنة بأنواعها",
    "description": "",
    "price": 0.6,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 50,
    "name": "مرتديلا بالجبن",
    "description": "",
    "price": 0.75,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 51,
    "name": "صاج لسان",
    "description": "",
    "price": 0.85,
    "category": "سندويشات الصاج",
    "image": "",
    "options": [
      "بدون طحينة",
      "بدون ثوم",
      "بدون سلطة",
      "بدون طماطم",
      "زيادة طحينة",
      "قليل طحينة",
      "طماطم فقط",
      "مع بطاطا"
    ]
  },
  {
    "id": 52,
    "name": "كباب لحم",
    "description": "",
    "price": 2.75,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 53,
    "name": "كباب دجاج",
    "description": "",
    "price": 2.25,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 54,
    "name": "كفتة بالشبك",
    "description": "",
    "price": 2.5,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 55,
    "name": "مشويات",
    "description": "",
    "price": 3.0,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 56,
    "name": "تكة",
    "description": "",
    "price": 3.0,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 57,
    "name": "خشخاش",
    "description": "",
    "price": 3.0,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 58,
    "name": "كباب فلسطيني",
    "description": "",
    "price": 2.5,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 59,
    "name": "طاووق",
    "description": "",
    "price": 3.0,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 60,
    "name": "دجاج ع الفحم",
    "description": "",
    "price": 3.0,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 61,
    "name": "عربي لحم",
    "description": "",
    "price": 2.25,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 62,
    "name": "عربي دجاج",
    "description": "",
    "price": 2.25,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 63,
    "name": "عرايس لحم",
    "description": "",
    "price": 2.0,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 64,
    "name": "عرايس دجاج",
    "description": "",
    "price": 1.75,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 65,
    "name": "عرايس جبن",
    "description": "",
    "price": 2.5,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 66,
    "name": "دجاج شواية",
    "description": "",
    "price": 2.75,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 67,
    "name": "برياني دجاج",
    "description": "",
    "price": 2.25,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 68,
    "name": "عرايس لحم جبن",
    "description": "",
    "price": 2.5,
    "category": "مشويات الخالدية",
    "image": ""
  },
  {
    "id": 69,
    "name": "3 أشخاص",
    "description": "",
    "price": 12.0,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 70,
    "name": "4 أشخاص",
    "description": "",
    "price": 14.0,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 71,
    "name": "5 أشخاص",
    "description": "",
    "price": 17.5,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 72,
    "name": "6 أشخاص",
    "description": "",
    "price": 20.0,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 73,
    "name": "8 أشخاص",
    "description": "",
    "price": 24.0,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 74,
    "name": "10 أشخاص",
    "description": "",
    "price": 28.0,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 75,
    "name": "استيك لحم عجل",
    "description": "",
    "price": 2.5,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 76,
    "name": "نص دجاج شواية بطاط",
    "description": "",
    "price": 1.5,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 77,
    "name": "نص دجاج ع الفحم بطاط",
    "description": "",
    "price": 1.5,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 78,
    "name": "نص برياني مع مرق",
    "description": "",
    "price": 1.25,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 79,
    "name": "مجبوس دجاج",
    "description": "",
    "price": 2.5,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 80,
    "name": "ماعون كفتة بالمرق",
    "description": "",
    "price": 2.5,
    "category": "صواني مشويات",
    "image": "",
    "options": [
      "بدون تكا",
      "بدون طاووق",
      "بدون كباب",
      "بدون عرايس"
    ]
  },
  {
    "id": 81,
    "name": "شاورما لحم",
    "description": "",
    "price": 3.0,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 82,
    "name": "شاورما دجاج",
    "description": "",
    "price": 3.0,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 83,
    "name": "شاورما لحم بالحمص",
    "description": "",
    "price": 3.5,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 84,
    "name": "شاورما دجاج بالحمص",
    "description": "",
    "price": 3.5,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 85,
    "name": "كبدة",
    "description": "",
    "price": 2.5,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 86,
    "name": "تكا لحم بالطماطم",
    "description": "",
    "price": 2.5,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 87,
    "name": "تكا دجاج بالطماطم",
    "description": "",
    "price": 2.5,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 88,
    "name": "مشروم",
    "description": "",
    "price": 2.0,
    "category": "مواعين الخالدية",
    "image": ""
  },
  {
    "id": 89,
    "name": "مشكل مقالي",
    "description": "",
    "price": 1.0,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 90,
    "name": "فول",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 91,
    "name": "مسقعة",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 92,
    "name": "قدسية",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 93,
    "name": "حمص",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 94,
    "name": "عجة",
    "description": "",
    "price": 1.5,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 95,
    "name": "لبنة",
    "description": "",
    "price": 2.0,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 96,
    "name": "أجبان",
    "description": "",
    "price": 3.0,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 97,
    "name": "ترويقه",
    "description": "",
    "price": 6.5,
    "category": "أفطار الخالدية (المواعين)",
    "image": ""
  },
  {
    "id": 98,
    "name": "حمص وسط",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 99,
    "name": "حمص بيروتي",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 100,
    "name": "متبل وسط",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 101,
    "name": "فتوش",
    "description": "",
    "price": 1.0,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 102,
    "name": "تبولة",
    "description": "",
    "price": 1.0,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 103,
    "name": "ورق عنب",
    "description": "",
    "price": 1.5,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 104,
    "name": "بابا غنوج",
    "description": "",
    "price": 1.25,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 105,
    "name": "خيار باللبن",
    "description": "",
    "price": 1.25,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 106,
    "name": "سلطة شمندر",
    "description": "",
    "price": 1.25,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 107,
    "name": "سلطة ذرة",
    "description": "",
    "price": 1.25,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 108,
    "name": "سلطة خضراء",
    "description": "",
    "price": 1.0,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 109,
    "name": "سلطة يونانية",
    "description": "",
    "price": 1.25,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 110,
    "name": "سلطة جرجير",
    "description": "",
    "price": 1.0,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 111,
    "name": "شيبس وسط",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 112,
    "name": "ثوم وسط",
    "description": "",
    "price": 0.75,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 113,
    "name": "حمص كبير",
    "description": "",
    "price": 1.5,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 114,
    "name": "متبل كبير",
    "description": "",
    "price": 1.5,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 115,
    "name": "شيبس كبير",
    "description": "",
    "price": 1.5,
    "category": "أفطار الخالدية (المقبلات والسلطات)",
    "image": "",
    "options": [
      "بدون طماطم",
      "بدون زيت",
      "مخلوط"
    ]
  },
  {
    "id": 116,
    "name": "كوكتيل",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 117,
    "name": "برتقال",
    "description": "",
    "price": 0.6,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 118,
    "name": "جزر",
    "description": "",
    "price": 0.6,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 119,
    "name": "تفاح",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 120,
    "name": "كيوي",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 121,
    "name": "إمبراطور",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 122,
    "name": "عوار قلب",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 123,
    "name": "فراولة",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 124,
    "name": "مانجو",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 125,
    "name": "موز حليب",
    "description": "",
    "price": 0.6,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 126,
    "name": "موز + مانجو",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 127,
    "name": "ليمون بالنعناع",
    "description": "",
    "price": 0.6,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 128,
    "name": "كوكتيل شاي",
    "description": "",
    "price": 0.75,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 129,
    "name": "مياه صحية",
    "description": "",
    "price": 0.15,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 130,
    "name": "مرطبات غازية",
    "description": "",
    "price": 0.15,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 131,
    "name": "بطل عصير صغير",
    "description": "",
    "price": 1.5,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 132,
    "name": "بطل عصير كبير",
    "description": "",
    "price": 3.5,
    "category": "العصائر",
    "image": ""
  },
  {
    "id": 133,
    "name": "جلاص ثلج",
    "description": "",
    "price": 0.15,
    "category": "العصائر",
    "image": ""
  }
];
const featuredNames = new Set(["فلافل", "شاورما لحم", "شاورما دجاج", "كباب لحم", "صينية مشويات 3 أشخاص", "حمص وسط", "كوكتيل"]); defaultProducts.forEach(p => { if (featuredNames.has(p.name)) p.featured = true; });
const MENU_VERSION = "2026-11-10-final-menu"; export const getProducts = (): Product[] => { try { if (localStorage.getItem("matamly_menu_version") !== MENU_VERSION) { localStorage.setItem("matamly_menu_version", MENU_VERSION); localStorage.setItem("matamly_products", JSON.stringify(defaultProducts)); return defaultProducts; } return JSON.parse(localStorage.getItem("matamly_products") || "null") || defaultProducts; } catch { return defaultProducts; } };
const money = (n: number) => `${n.toFixed(3)} د.ك`;
const defaultZones = [{ name: "العاصمة", fee: 1 }, { name: "القبلة", fee: 1 }, { name: "المرقاب", fee: 1 }, { name: "الشرق", fee: 1 }, { name: "الدسمة", fee: 1 }, { name: "الدعية", fee: 1 }, { name: "الشامية", fee: 1 }, { name: "الفيحاء", fee: 1 }, { name: "كيفان", fee: 1 }, { name: "الخالدية", fee: 1 }, { name: "العديلية", fee: 1 }, { name: "الروضة", fee: 1 }, { name: "اليرموك", fee: 1 }, { name: "قرطبة", fee: 1 }, { name: "السرة", fee: 1 }, { name: "النزهة", fee: 1 }, { name: "المنصورية", fee: 1 }, { name: "الضاحية", fee: 1 }, { name: "حولي", fee: 1 }, { name: "السالمية", fee: 1 }, { name: "الرميثية", fee: 1 }, { name: "الجابرية", fee: 1 }, { name: "مشرف", fee: 1 }, { name: "بيان", fee: 1 }, { name: "مبارك العبدالله", fee: 1 }, { name: "سلوى", fee: 1 }, { name: "الشهداء", fee: 1 }, { name: "الزهراء", fee: 1 }, { name: "الصديق", fee: 1 }, { name: "السلام", fee: 1 }, { name: "حطين", fee: 1 }, { name: "الشعب", fee: 1 }, { name: "البدع", fee: 1 }, { name: "الفروانية", fee: 1 }, { name: "العارضية", fee: 1 }, { name: "إشبيلية", fee: 1 }, { name: "الرحاب", fee: 1 }, { name: "الرابية", fee: 1 }, { name: "الرقعي", fee: 1 }, { name: "جليب الشيوخ", fee: 1 }, { name: "خيطان", fee: 1 }, { name: "العمرية", fee: 1 }, { name: "الفردوس", fee: 1 }, { name: "الأندلس", fee: 1 }, { name: "النهضة", fee: 1 }, { name: "الري", fee: 1 }, { name: "الصليبية", fee: 1 }, { name: "الجهراء", fee: 1 }, { name: "القصر", fee: 1 }, { name: "النعيم", fee: 1 }, { name: "النسيم", fee: 1 }, { name: "الواحة", fee: 1 }, { name: "تيماء", fee: 1 }, { name: "العيون", fee: 1 }, { name: "سعد العبدالله", fee: 1 }, { name: "أمغرة", fee: 1 }, { name: "العبدلي", fee: 1 }, { name: "كبد", fee: 1 }, { name: "السالمية الصناعية", fee: 1 }, { name: "ميناء عبدالله", fee: 1 }, { name: "الفحيحيل", fee: 1 }, { name: "المنقف", fee: 1 }, { name: "المهبولة", fee: 1 }, { name: "أبو حليفة", fee: 1 }, { name: "الصباحية", fee: 1 }, { name: "الرقة", fee: 1 }, { name: "هدية", fee: 1 }, { name: "الفنطاس", fee: 1 }, { name: "العقيلة", fee: 1 }, { name: "أبو فطيرة", fee: 1 }, { name: "المسايل", fee: 1 }, { name: "صباح السالم", fee: 1 }, { name: "القرين", fee: 1 }, { name: "العدان", fee: 1 }, { name: "الفنيطيس", fee: 1 }, { name: "أبو الحصانية", fee: 1 }, { name: "صبحان", fee: 1 }, { name: "الجليعة", fee: 1 }, { name: "الخيران", fee: 1 }, { name: "الوفرة", fee: 1 }];
const getZones = () => { try { return JSON.parse(localStorage.getItem("matamly_zones") || "null") || defaultZones; } catch { return defaultZones; } };
const setting = (key: string, fallback: string) => localStorage.getItem(key) || fallback;
const defaultMenuCategories = ["السندويشات الخفيفة", "السندويشات الحارة والباردة", "سندويشات الصاج", "مشويات الخالدية", "صواني مشويات", "مواعين الخالدية", "أفطار الخالدية (المواعين)", "أفطار الخالدية (المقبلات والسلطات)", "العصائر"]; const getCategoryOrder = () => { try { const stored = JSON.parse(localStorage.getItem("matamly_category_order") || "null"); return stored ? [...stored.filter((c:string) => defaultMenuCategories.includes(c)), ...defaultMenuCategories.filter(c => !stored.includes(c))] : defaultMenuCategories; } catch { return defaultMenuCategories; } };
const getCategoryImages = () => { try { return JSON.parse(localStorage.getItem("matamly_category_images") || "{}"); } catch { return {}; } };
const isAvailable = (p: Product) => { if (!p.availableFrom || !p.availableTo) return true; const now = new Date(); const current = now.getHours() * 60 + now.getMinutes(); const [fh, fm] = p.availableFrom.split(":").map(Number); const [th, tm] = p.availableTo.split(":").map(Number); const from = fh * 60 + fm, to = th * 60 + tm; return from <= to ? current >= from && current <= to : current >= from || current <= to; };
const applyVisualSettings = () => { const paletteVersion="global-green-v1"; if(localStorage.getItem("matamly_palette_version")!==paletteVersion && localStorage.getItem("matamly_settings_from_server")!=="1"){localStorage.setItem("matamly_palette_version",paletteVersion);localStorage.setItem("matamly_theme","warm");localStorage.setItem("matamly_primary_color","#123C2F");localStorage.setItem("matamly_accent_color","#C85A3F");localStorage.setItem("matamly_bg_color","#F6F2E9");localStorage.setItem("matamly_header_color","#FFFDF8");localStorage.setItem("matamly_footer_color","#0B2B22");localStorage.setItem("matamly_edge_color","#F6F2E9");localStorage.setItem("matamly_offer_bg_color","#123C2F");localStorage.setItem("matamly_offer_text_color","#FFFFFF");} const root = document.documentElement; const themes: Record<string, {primary:string; accent:string; bg:string; paper:string}> = { warm: {primary:"#31422c", accent:"#bb5b3b", bg:"#f3efe5", paper:"#fffefa"}, charcoal: {primary:"#20252b", accent:"#d38b3d", bg:"#eef0f2", paper:"#ffffff"}, ocean: {primary:"#154b5c", accent:"#d36b4f", bg:"#e8f1f2", paper:"#ffffff"}, rose: {primary:"#633b4e", accent:"#bf6b70", bg:"#f7edef", paper:"#fffafb"}, sunset: {primary:"#66352c", accent:"#e09a3e", bg:"#fff1df", paper:"#fffaf3"}, mint: {primary:"#20564c", accent:"#d18b62", bg:"#e7f3ed", paper:"#fbfffc"}, lavender: {primary:"#4b4168", accent:"#9b6fc3", bg:"#f1eef9", paper:"#fffaff"}, midnight: {primary:"#172032", accent:"#e0a548", bg:"#e9edf4", paper:"#ffffff"} }; const t = themes[localStorage.getItem("matamly_theme") || "warm"] || themes.warm; root.style.setProperty("--olive", localStorage.getItem("matamly_primary_color") || t.primary); root.style.setProperty("--terracotta", localStorage.getItem("matamly_accent_color") || t.accent); root.style.setProperty("--cream", localStorage.getItem("matamly_bg_color") || t.bg); root.style.setProperty("--paper", localStorage.getItem("matamly_paper_color") || t.paper); root.style.setProperty("--header-size", `${localStorage.getItem("matamly_header_size") || 76}px`); root.style.setProperty("--footer-size", `${localStorage.getItem("matamly_footer_size") || 64}px`); root.style.setProperty("--logo-size", `${localStorage.getItem("matamly_logo_size") || 84}px`); root.style.setProperty("--header-color", localStorage.getItem("matamly_header_color") || t.paper); root.style.setProperty("--footer-color", localStorage.getItem("matamly_footer_color") || t.primary); root.style.setProperty("--edge-color", localStorage.getItem("matamly_edge_color") || "#176f69"); const radii: Record<string,string> = {soft:"14px", square:"3px", pill:"28px"}; root.style.setProperty("--radius", radii[localStorage.getItem("matamly_shape") || "soft"] || "14px"); root.style.setProperty("--hero-height", `${localStorage.getItem("matamly_hero_size") || 330}px`); root.style.setProperty("--category-card-height", `${localStorage.getItem("matamly_category_card_height") || 150}px`); root.style.setProperty("--category-card-radius", localStorage.getItem("matamly_category_card_shape") || "14px"); };
const applyTrackingPixels = () => { const meta = localStorage.getItem("matamly_meta_pixel"); if (meta && !(window as any).fbq) { const w:any=window; const n:any=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)}; n.queue=[]; n.version="2.0"; w.fbq=n; const script=document.createElement("script"); script.async=true; script.src="https://connect.facebook.net/en_US/fbevents.js"; document.head.appendChild(script); n("init",meta); n("track","PageView"); } else if(meta && (window as any).fbq) (window as any).fbq("track","PageView"); const tiktok = localStorage.getItem("matamly_tiktok_pixel"); if(tiktok && !document.getElementById("tiktok-pixel")){ const script=document.createElement("script"); script.id="tiktok-pixel"; script.innerHTML=`!function (w, d, t) { w.TiktokAnalyticsObject=t; var ttq=w[t]=w[t]||[]; ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"]; ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]); ttq.instance=function(t){var e=ttq._i[t]||[]; return ttq._i[t]=e}; ttq.load('${tiktok}'); ttq.page(); }(window, document, 'ttq');`; document.head.appendChild(script); } const twitter = localStorage.getItem("matamly_twitter_pixel"); if(twitter && !(window as any).twq){ const script=document.createElement("script"); script.innerHTML=`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version="1.1",s.queue=[],u=t.createElement(n),u.async=!0,u.src="https://static.ads-twitter.com/uwt.js",a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,"script"); twq("config","${twitter}");`; document.head.appendChild(script); } };

const readBanner = () => ({
  visible: localStorage.getItem("matamly_banner_visible") !== "0",
  name: localStorage.getItem("matamly_banner_name") || "فتوش الخالدية",
  slogan: localStorage.getItem("matamly_banner_slogan") || "",
  size: Number(localStorage.getItem("matamly_banner_size") || 52),
  color1: localStorage.getItem("matamly_banner_color_1") || "#F4E2B0",
  color2: localStorage.getItem("matamly_banner_color_2") || "#E7B15A",
  color3: localStorage.getItem("matamly_banner_color_3") || "#F7F1E4",
  bg: localStorage.getItem("matamly_banner_bg") || "#123C2F",
  align: localStorage.getItem("matamly_banner_align") || "center",
  preset: localStorage.getItem("matamly_banner_preset") || "heritage",
});
function kuwaitClockMinutes() { const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuwait", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()); const hour = Number(parts.find(p => p.type === "hour")?.value || 0); const minute = Number(parts.find(p => p.type === "minute")?.value || 0); return hour * 60 + minute; }
function withinClockWindow(now: number, start: string, end: string) { const toMinutes = (value: string, fallback: number) => { const match = /^(\d{2}):(\d{2})$/.exec(value || ""); return match ? Number(match[1]) * 60 + Number(match[2]) : fallback; }; const from = toMinutes(start, 390); const until = toMinutes(end, 30); return from <= until ? now >= from && now < until : now >= from || now < until; }
export default function Home() {
  const [categoryImageVersion,setCategoryImageVersion] = useState(0); const [heroImage, setHeroImage] = useState(localStorage.getItem("matamly_hero_image") || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1100&q=90"); const [heroVisible,setHeroVisible] = useState(localStorage.getItem("matamly_home_visibility_configured") !== "1" || localStorage.getItem("matamly_hero_visible") !== "0"); const heroTitle = localStorage.getItem("matamly_hero_title") || "فتوش الخالدية"; const heroSubtitle = localStorage.getItem("matamly_hero_subtitle") || ""; const heroKicker = localStorage.getItem("matamly_hero_kicker") || ""; const heroTextColor = localStorage.getItem("matamly_hero_text_color") || "#31422c"; const heroBgColor = localStorage.getItem("matamly_hero_bg_color") || ""; const heroSize = Number(localStorage.getItem("matamly_hero_size") || 330); const [featuredVisible,setFeaturedVisible] = useState(localStorage.getItem("matamly_home_visibility_configured") !== "1" || localStorage.getItem("matamly_featured_visible") !== "0"); const offerVisible = localStorage.getItem("matamly_offer_visible") !== "0"; const offerTitle = localStorage.getItem("matamly_offer_title") || "عرض الأسبوع"; const offerSubtitle = localStorage.getItem("matamly_offer_subtitle") || "خصم خاص لفترة محدودة"; const offerBadge = localStorage.getItem("matamly_offer_badge") || "خصم 15%"; const offerImage = localStorage.getItem("matamly_offer_image") || ""; const offerTextColor = localStorage.getItem("matamly_offer_text_color") || "#ffffff"; const offerBgColor = localStorage.getItem("matamly_offer_bg_color") || "#176f69"; const [language, setLanguage] = useState<"ar"|"en">(() => (localStorage.getItem("matamly_language") as "ar"|"en") || "ar"); const tr = (ar:string,en:string) => language === "ar" ? ar : en; const [products, setProducts] = useState<Product[]>(() => getProducts().filter(p => !p.hidden)); const [productRatings,setProductRatings]=useState<Record<string,{average:number;count:number}>>({}); const [ratingOrderNumber,setRatingOrderNumber]=useState(""); const [ratingItems,setRatingItems]=useState<{productId:string;name:string;rating:number|null}[]>([]); const [ratingMessage,setRatingMessage]=useState(""); const [ratingLoading,setRatingLoading]=useState(false);
  const [layout, setLayout] = useState(localStorage.getItem("matamly_layout") || "classic"); const [category, setCategory] = useState(()=>new URLSearchParams(window.location.search).get("category") || "الكل"); const [sortMode,setSortMode]=useState("popular"); const [deliveryZone, setDeliveryZone] = useState(""); const [zones, setZones] = useState<{id?: number; name: string; fee: number; minimumOrder?: number}[]>(() => getZones().map((z: {name:string;fee:number}) => ({ name: z.name, fee: Number(z.fee) || 0, minimumOrder: Number(localStorage.getItem("matamly_min_order") || 3) }))); const [cart, setCart] = useState<CartItem[]>([]); const [customizing, setCustomizing] = useState<Product | null>(null); const [selectedChoices, setSelectedChoices] = useState<string[]>([]); const [cartOpen, setCartOpen] = useState(false); const [checkoutOpen, setCheckoutOpen] = useState(false); const [confirmedNumber, setConfirmedNumber] = useState<number | null>(null); const [requestId, setRequestId] = useState(""); const [orderError, setOrderError] = useState(""); const [justAdded,setJustAdded]=useState<number|null>(null);
  const [serviceMode, setServiceMode] = useState(localStorage.getItem("matamly_service_mode") || "التوصيل"); const [openTime, setOpenTime] = useState(localStorage.getItem("matamly_open_time") || "06:30"); const [closeTime, setCloseTime] = useState(localStorage.getItem("matamly_close_time") || "00:30"); const [deliveryStartTime, setDeliveryStartTime] = useState(localStorage.getItem("matamly_delivery_start_time") || "11:30"); const [kuwaitNow, setKuwaitNow] = useState(kuwaitClockMinutes); const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const [accountOpen, setAccountOpen] = useState(false); const [customer, setCustomer] = useState<{id?:number;name:string;phone:string;email?:string} | null>(null); const [accountMode,setAccountMode]=useState<"login"|"register">("login"); const [accountBusy,setAccountBusy]=useState(false); const [accountMessage,setAccountMessage]=useState(""); const [accountOrders,setAccountOrders]=useState<any[]>([]); const [customerAddresses,setCustomerAddresses]=useState<any[]>([]); const [restaurant, setRestaurant] = useState(() => setting("matamly_name", "مطعمي")); const [logo, setLogo] = useState(() => localStorage.getItem("matamly_logo") || ""); const [banner, setBanner] = useState(readBanner);
  useEffect(()=>{let alive=true;fetch("/api/customer/me",{credentials:"same-origin",cache:"no-store"}).then(async response=>{if(!response.ok)return null;return response.json()}).then(async data=>{if(alive&&data?.ok){setCustomer(data.customer);setCustomerAddresses(data.addresses||[]);const history=await fetch("/api/customer/orders",{credentials:"same-origin",cache:"no-store"}).then(x=>x.json()).catch(()=>({orders:[]}));if(alive)setAccountOrders(history.orders||[]);}}).catch(()=>{});return()=>{alive=false}},[]);
  const menuCategories = getCategoryOrder(); const categories = ["الكل", ...menuCategories]; const categoryImages = getCategoryImages(); const featuredProducts = products.filter(p => p.featured).slice(0, 8); const homeFeaturedProducts = featuredProducts.length ? featuredProducts : products.filter(p => !p.hidden).slice(0, 4); const filtered = category === "الكل" ? products : products.filter(p => p.category === category); const homeCategoryLimit = (()=>{try{return JSON.parse(localStorage.getItem("matamly_home_category_limit")||"{}") as Record<string,number>}catch{return {}}})(); const homeCategoryProducts = (()=>{try{return JSON.parse(localStorage.getItem("matamly_home_category_products")||"{}") as Record<string,number[]>}catch{return {}}})(); const homeSelectedIds = category === "الكل" ? menuCategories.flatMap(c=>{const available=products.filter(p=>p.category===c&&!p.hidden);const chosen=Array.isArray(homeCategoryProducts[c])?homeCategoryProducts[c]:available.slice(0,3).map(p=>p.id);const limit=Math.max(0,Math.min(available.length,Number(homeCategoryLimit[c]??3)));return chosen.filter(id=>available.some(p=>p.id===id)).slice(0,limit);}) : []; const visibleProducts = category === "الكل" ? products.filter(p=>homeSelectedIds.includes(p.id)) : filtered; const displayProducts = [...visibleProducts].sort((a,b)=>sortMode === "price-asc" ? a.price-b.price : sortMode === "price-desc" ? b.price-a.price : Number(Boolean(b.featured))-Number(Boolean(a.featured))); const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]); const contactPhones = [localStorage.getItem("matamly_phone1") || "", localStorage.getItem("matamly_phone2") || ""].filter(Boolean);
  useEffect(() => { fetch("/api/product-ratings",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{const next:Record<string,{average:number;count:number}>={};for(const item of data?.ratings||[])next[String(item.productId)]={average:Number(item.average),count:Number(item.count)};setProductRatings(next);}).catch(()=>undefined); }, []);
  useEffect(() => { const refreshClock = () => setKuwaitNow(kuwaitClockMinutes()); refreshClock(); const timer = window.setInterval(refreshClock, 30000); fetch("/api/settings", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { const settings = data?.settings || {}; if (typeof settings.matamly_open_time === "string") setOpenTime(settings.matamly_open_time); if (typeof settings.matamly_close_time === "string") setCloseTime(settings.matamly_close_time); if (typeof settings.matamly_delivery_start_time === "string") setDeliveryStartTime(settings.matamly_delivery_start_time); }).catch(() => undefined); return () => window.clearInterval(timer); }, []);
  useEffect(() => { localStorage.setItem("matamly_language", language); document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }, [language]);
  useEffect(() => { fetch("/api/settings", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (data?.settings && typeof data.settings === "object") { for (const [key, value] of Object.entries(data.settings)) if (key.startsWith("matamly_") && typeof value === "string") localStorage.setItem(key, value); setHeroVisible(data.settings.matamly_home_visibility_configured !== "1" || data.settings.matamly_hero_visible !== "0"); setFeaturedVisible(data.settings.matamly_home_visibility_configured !== "1" || data.settings.matamly_featured_visible !== "0"); localStorage.setItem("matamly_settings_from_server", "1"); applyVisualSettings(); setBanner(readBanner()); setRestaurant(setting("matamly_name", "فتوش الخالدية")); setLogo(localStorage.getItem("matamly_logo") || ""); setLayout(localStorage.getItem("matamly_layout") || "classic"); setHeroImage(localStorage.getItem("matamly_hero_image") || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1100&q=90"); setCategoryImageVersion(v => v + 1); } }).catch(() => undefined); fetch("/api/delivery-areas", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (Array.isArray(data?.areas)) setZones(data.areas); }).catch(() => undefined); fetch("/api/menu", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (Array.isArray(data?.products) && data.products.length) { localStorage.setItem("matamly_products", JSON.stringify(data.products)); setProducts(data.products.filter((p: Product) => !p.hidden)); } }).catch(() => undefined); applyVisualSettings(); applyTrackingPixels(); if (!sessionStorage.getItem("matamly_seen")) { sessionStorage.setItem("matamly_seen", "1"); localStorage.setItem("matamly_visits", String(Number(localStorage.getItem("matamly_visits") || 0) + 1)); } const onStorage = () => { setHeroVisible(localStorage.getItem("matamly_home_visibility_configured") !== "1" || localStorage.getItem("matamly_hero_visible") !== "0"); setFeaturedVisible(localStorage.getItem("matamly_home_visibility_configured") !== "1" || localStorage.getItem("matamly_featured_visible") !== "0"); setProducts(getProducts().filter(p => !p.hidden)); setRestaurant(setting("matamly_name", "مطعمي")); setLogo(localStorage.getItem("matamly_logo") || ""); setLayout(localStorage.getItem("matamly_layout") || "classic"); setHeroImage(localStorage.getItem("matamly_hero_image") ?? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=90"); setCategoryImageVersion(v=>v+1); applyVisualSettings(); applyTrackingPixels(); }; window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage); }, []);
  useEffect(() => { const items = Array.from(document.querySelectorAll<HTMLElement>(".site-shell .offer-banner, .site-shell .promise, .site-shell .contact-panel, .site-shell .product-card, .site-shell .category-cards button")); items.forEach((el,i)=>{el.classList.add("motion-item"); el.style.setProperty("--motion-delay", `${Math.min(i%8,7)*55}ms`);}); const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible"); observer.unobserve(entry.target);}}),{threshold:0,rootMargin:"200px 0px 200px 0px"}); items.forEach(el=>observer.observe(el)); const reveal = window.setTimeout(()=>items.forEach(el=>el.classList.add("is-visible")), 1500); return ()=>{ window.clearTimeout(reveal); observer.disconnect(); }; }, []);
  useEffect(() => { const onPopState=()=>setCategory(new URLSearchParams(window.location.search).get("category") || "الكل"); window.addEventListener("popstate",onPopState); return ()=>window.removeEventListener("popstate",onPopState); }, []);
  const addToCart = (p: Product, choices: string[] = []) => { if ((window as any).fbq) (window as any).fbq("track","AddToCart",{content_name:p.name,value:p.price,currency:"KWD"}); return setCart(items => { const found = items.find(i => i.id === p.id && JSON.stringify(i.choices || []) === JSON.stringify(choices)); return found ? items.map(i => i.id === p.id && JSON.stringify(i.choices || []) === JSON.stringify(choices) ? { ...i, qty: i.qty + 1 } : i) : [...items, { ...p, qty: 1, choices }]; }); }; const add = (p: Product) => { if (p.options?.length) { setCustomizing(p); setSelectedChoices([]); } else addToCart(p); };
  const quickAdd = (p: Product) => { add(p); setJustAdded(p.id); window.setTimeout(()=>setJustAdded(id=>id===p.id?null:id),700); };
  const lineKey = (item: {id:number; choices?: string[]}) => `${item.id}::${JSON.stringify(item.choices || [])}`; const change = (key: string, delta: number) => setCart(items => items.map(i => lineKey(i) === key ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const restaurantOpen = withinClockWindow(kuwaitNow, openTime, closeTime); const deliveryAvailable = restaurantOpen && withinClockWindow(kuwaitNow, deliveryStartTime, closeTime); useEffect(() => { if (!deliveryAvailable && serviceMode === "التوصيل") { setServiceMode("استلام من المطعم"); localStorage.setItem("matamly_service_mode", "استلام من المطعم"); } }, [deliveryAvailable, serviceMode]); const selectedZone = zones.find((z) => String(z.id ?? z.name) === String(deliveryZone)); const minOrder = serviceMode === "التوصيل" && selectedZone ? Number(selectedZone.minimumOrder ?? 0) : 0; const deliveryFee = serviceMode === "التوصيل" && selectedZone ? Number(selectedZone.fee || 0) : 0; const cartCount = cart.reduce((s, i) => s + i.qty, 0); const grandTotal = total + deliveryFee;
  const sendOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOrderError("");
    if (serviceMode === "التوصيل" && !selectedZone?.id) { setOrderError("يرجى اختيار منطقة توصيل متاحة"); return; }
    if (serviceMode === "التوصيل" && total < minOrder) { setOrderError(`الحد الأدنى لهذه المنطقة هو ${money(minOrder)} ورسوم التوصيل ${money(deliveryFee)}`); return; }
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const payment = String(data.get("payment") || "الدفع عند الاستلام");
    const notes = String(data.get("notes") || "");
    const addressParts = { block: String(data.get("block") || ""), street: String(data.get("street") || ""), avenue: String(data.get("avenue") || ""), floor: String(data.get("floor") || ""), apartment: String(data.get("apartment") || ""), house: String(data.get("house") || "") };
    const activeRequest = requestId || crypto.randomUUID();
    if (!requestId) setRequestId(activeRequest);
    try {
      const savedOrder = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientRequestId: activeRequest, customer: { name, phone }, items: cart.map(i => ({ id: i.id, qty: i.qty, choices: i.choices || [] })), areaId: serviceMode === "التوصيل" ? selectedZone?.id : undefined, addressParts: serviceMode === "التوصيل" ? addressParts : undefined, notes, payment, serviceMode: serviceMode === "التوصيل" ? "delivery" : "pickup" }) });
      const result = await savedOrder.json().catch(() => ({}));
      if (!savedOrder.ok) { setOrderError(result.message || "تعذر تسجيل الطلب. السلة ما زالت كما هي."); return; }
      setConfirmedNumber(Number(result.orderNumber));
      setRequestId("");
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch { setOrderError("تعذر الاتصال بالخادم. السلة ما زالت محفوظة ويمكنك المحاولة مرة أخرى."); }
  };

  return <div className={`site-shell layout-${layout} ${category!=="الكل"?"category-page":""}`}>{banner.visible && <section className={`brand-banner preset-${banner.preset}`} style={{background:banner.bg,textAlign:banner.align as "left" | "right" | "center"}}><div className="brand-banner-inner"><h1 style={{fontSize:`${banner.size}px`}}>{banner.name.split(/\s+/).filter(Boolean).map((word,index)=><span key={`${word}-${index}`} style={{color:[banner.color1,banner.color2,banner.color3][index%3]}}>{word}</span>)}</h1>{banner.slogan ? <p style={{color:banner.color3}}>{banner.slogan}</p> : null}</div></section>}<header className="topbar"><div className={"brand logo-pos-"+(localStorage.getItem("matamly_logo_position")||"start")}>{logo ? <img src={logo} alt="" className="brand-logo"/> : <span className="brand-mark">✦</span>}<span>{restaurant}</span><small>طعم البيت، أسرع</small><div className="brand-service-switch">{["التوصيل","استلام من المطعم"].map(mode=><button type="button" key={mode} className={`${serviceMode===mode?"active":""} ${mode==="التوصيل"&&!deliveryAvailable?"unavailable":""}`} aria-disabled={mode==="التوصيل"&&!deliveryAvailable} onClick={()=>{if(mode==="التوصيل"&&!deliveryAvailable){window.alert(language==="ar"?`التوصيل غير متاح حاليًا. يبدأ التوصيل بعد الساعة ${deliveryStartTime} صباحًا.`:`Delivery is currently unavailable. Delivery starts at ${deliveryStartTime} AM.`);return;}setServiceMode(mode);localStorage.setItem("matamly_service_mode",mode)}}>{language==="ar"?mode:mode==="التوصيل"?"Delivery":"Restaurant pickup"}</button>)}</div></div><nav className={mobileMenuOpen ? "mobile-nav-open" : ""}><select className="section-select" value={category} onChange={e=>{setCategory(e.target.value);setMobileMenuOpen(false);document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}}><option value="الكل">{tr("الأقسام","Categories")}</option>{categories.filter(c=>c!=="الكل").map(c=><option key={c} value={c}>{c}</option>)}</select></nav><button className="language-toggle" onClick={()=>setLanguage(v=>v==="ar"?"en":"ar")} aria-label="تغيير اللغة">{language === "ar" ? "EN" : "عربي"}</button><button className="mobile-menu-btn" aria-label={tr("فتح القائمة","Open menu")} onClick={()=>setMobileMenuOpen(v=>!v)}><Menu size={22}/></button><button className="account-trigger" onClick={()=>setAccountOpen(true)}>◯ <span>{customer?.name || tr("حسابي","Account")}</span></button><button className="cart-trigger" onClick={() => setCartOpen(true)}><ShoppingBag size={19}/><span>{tr("السلة","Cart")}</span>{cartCount > 0 && <b>{cartCount}</b>}</button></header><div className="service-strip">{!restaurantOpen ? <p className="delivery-rule-note">المطعم مغلق حاليًا. مواعيد العمل من {openTime} إلى {closeTime} بتوقيت الكويت.</p> : !deliveryAvailable ? <p className="delivery-rule-note">التوصيل غير متاح حاليًا، يبدأ الساعة {deliveryStartTime}. يمكنك الاستلام من المطعم.</p> : serviceMode === "التوصيل" && <p className="delivery-rule-note">{selectedZone ? `الحد الأدنى ${money(minOrder)} — رسوم التوصيل ${money(deliveryFee)}` : "اختر منطقة التوصيل عند إتمام الطلب لعرض الحد الأدنى والرسوم."}</p>}</div><main>{heroVisible && <section className="hero" id="story" style={{background:heroBgColor || undefined}}><div className="hero-copy" style={{color:heroTextColor}}><span className="eyebrow"><Sparkles size={15}/> {heroKicker}</span><h1>{heroTitle}</h1><p>{heroSubtitle}</p><a className="primary-btn" href="#menu">{tr("اطلب الآن","Order now")} <ArrowLeft size={18}/></a><div className="hero-note"><span className="avatar-stack"><i>م</i><i>س</i><i>ر</i></span><span>+2,400 {tr("طلب سعيد هذا الشهر","happy orders this month")}</span></div></div><div className="hero-art"><div className="art-stamp">{tr("طازج","Fresh")}<br/><strong>{tr("كل يوم","Every day")}</strong></div>{heroImage ? <img src={heroImage} alt="صورة المطعم الرئيسية"/> : <div className="image-placeholder">أضف صورة البانر من لوحة الأدمن</div>}<div className="art-caption"><span>01</span><strong>من مطبخنا<br/>إلى سفرتك</strong></div></div></section>}{offerVisible && <section className="offer-banner" style={{background:offerBgColor,color:offerTextColor}}><div className="offer-banner-copy"><span className="eyebrow">{offerBadge}</span><h2>{offerTitle}</h2><p>{offerSubtitle}</p><button onClick={()=>document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}>تصفح العروض <ArrowLeft size={17}/></button></div>{offerImage && <img src={offerImage} alt="العرض الخاص"/>}</section>}{category === "الكل" && featuredVisible && <section className="menu-section featured-section" id="featured"><div className="section-heading"><div><span className="eyebrow">{tr("اختيارات الزبائن","Customer picks")}</span><h2>{tr("الأكثر طلباً","Best sellers")}</h2></div><span className="muted">{tr("أصناف يحبها زبائننا","Loved by our customers")}</span></div><div className="product-grid">{homeFeaturedProducts.map(p => <article className="product-card" key={`featured-${p.id}`}><div className="product-image"><span className="badge">الأكثر طلباً</span>{p.image ? <img src={p.image} alt={p.name}/> : <div className="image-placeholder">صورة الصنف لاحقاً</div>}<div className="product-actions"><button className="add-float" disabled={!isAvailable(p)} onClick={() => add(p)} aria-label="إضافة خيارات"><Plus size={19}/></button><button className="cart-float" disabled={!isAvailable(p)} onClick={() => setCartOpen(true)} aria-label="فتح السلة"><ShoppingBag size={17}/></button></div></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.description}</p>{productRatings[String(p.id)] && <small className="product-rating" aria-label="تقييم الصنف">⭐ {productRatings[String(p.id)].average.toFixed(1)} <span>({productRatings[String(p.id)].count})</span></small>}</div><strong>{money(p.price)}</strong><button className={`quick-add-btn ${justAdded===p.id?"is-added":""}`} onClick={()=>quickAdd(p)}>{justAdded===p.id?"تمت الإضافة ✓":p.options?.length?"اختيارات":"إضافة سريعة +"}</button></div></article>)}</div></section>}<section className="menu-section" id="menu"><div className="section-heading"><div><span className="eyebrow">{tr("اختر ما تشتهي","Choose what you crave")}</span><h2>{category === "الكل" ? "الأقسام" : category}</h2>{category !== "الكل" && <label className="sort-control">ترتيب المنتجات<select value={sortMode} onChange={e=>setSortMode(e.target.value)}><option value="popular">الأكثر طلباً</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option></select></label>}{category !== "الكل" && <button className="back-to-menu" onClick={()=>{setCategory("الكل");history.pushState({},"","/");window.scrollTo({top:0,behavior:"smooth"})}}>← العودة إلى كل الأقسام</button>}</div><span className="muted">{tr("توصيل سريع · دفع عند الاستلام","Fast delivery · Cash on delivery")}</span></div>{category === "الكل" && <div className="category-tabs category-cards">{menuCategories.map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => {setCategory(c); history.pushState({},"",`/?category=${encodeURIComponent(c)}`); document.getElementById("menu")?.scrollIntoView({behavior:"smooth",block:"start"})}}>{categoryImages[c] ? <img src={categoryImages[c]} alt=""/> : <span className="category-placeholder" aria-hidden="true">{c.includes("شاورما") ? "🌯" : c.includes("ساندويت") || c.includes("سندويش") ? "🍔" : c.includes("مشوي") || c.includes("صواني") ? "🍢" : c.includes("عص") ? "🥤" : c.includes("مواعيد") || c.includes("أفطار") ? "🍽️" : c.includes("منيو") ? "📋" : "🍴"}</span>}<span>{c}</span></button>)}</div>}{category !== "الكل" && <div className="product-grid">{displayProducts.map(p => <article className="product-card" key={p.id}><div className="product-image">{p.badge && <span className="badge">{p.badge}</span>}{p.image ? <img src={p.image} alt={p.name}/> : <div className="image-placeholder">صورة الصنف لاحقاً</div>}<div className="product-actions"><button className="add-float" disabled={!isAvailable(p)} onClick={() => add(p)} aria-label="إضافة خيارات"><Plus size={19}/></button><button className="cart-float" disabled={!isAvailable(p)} onClick={() => setCartOpen(true)} aria-label="فتح السلة"><ShoppingBag size={17}/></button></div></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.description}</p>{productRatings[String(p.id)] && <small className="product-rating" aria-label="تقييم الصنف">⭐ {productRatings[String(p.id)].average.toFixed(1)} <span>({productRatings[String(p.id)].count})</span></small>}{p.availableFrom && p.availableTo && !isAvailable(p) && <small className="availability-note">متاح من {p.availableFrom} إلى {p.availableTo}</small>}</div><strong>{money(p.price)}</strong><button className={`quick-add-btn ${justAdded===p.id?"is-added":""}`} onClick={()=>quickAdd(p)}>{justAdded===p.id?"تمت الإضافة ✓":p.options?.length?"اختيارات":"إضافة سريعة +"}</button></div></article>)}</div>}</section><section className="contact-panel" id="contact"><div><span className="eyebrow">{tr("تواصل معنا","Contact us")}</span><h2>مطعم فتوش الخالدية</h2><p>{tr("اطلب وجبتك مباشرة وتابع طلباتك من حسابك.","Order directly and follow your orders from your account.")}</p></div><div className="contact-actions">{contactPhones.map(phone=><a key={phone} href={`tel:${phone}`}>اتصال: {phone}</a>)}<button onClick={()=>document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}>{tr("الأقسام ▾","Categories ▾")}</button><button onClick={()=>setAccountOpen(true)}>{tr("حساب العميل","Customer account")}</button></div></section></main><footer className="site-footer" style={{textAlign:(localStorage.getItem("matamly_footer_align") || "center") as "left" | "right" | "center"}}><span>© 2026 {restaurant}</span>{localStorage.getItem("matamly_footer_visible") !== "0" && <span className="footer-rights" style={{fontSize:`${localStorage.getItem("matamly_footer_text_size") || 11}px`,color:localStorage.getItem("matamly_footer_text_color") || "var(--muted)",textAlign:(localStorage.getItem("matamly_footer_align") || "center") as any}}>{localStorage.getItem("matamly_footer_text") || tr("جميع الحقوق محفوظة — إنشاء م/ محمد فتحي","All rights reserved — Created by Eng. Mohamed Fathy")}</span>}</footer><nav className="customer-bottom-nav" aria-label="التنقل الرئيسي"><button onClick={()=>setAccountOpen(true)}><UserRound/><small>حسابي</small></button><button onClick={()=>setAccountOpen(true)}><ClipboardList/><small>الطلبات</small></button><button className="bottom-cart" onClick={()=>setCartOpen(true)}><ShoppingCart/>{cartCount>0&&<b>{cartCount}</b>}<small>السلة</small></button><button onClick={()=>{setCategory("الكل");document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}}><BookOpen/><small>القائمة</small></button><button className="active" onClick={()=>{window.scrollTo({top:0,behavior:"smooth"});setCategory("الكل")}}><HomeIcon/><small>الرئيسية</small></button></nav>{confirmedNumber && <div className="overlay"><div className="checkout-modal"><div className="drawer-head"><div><span className="eyebrow">تم استلام الطلب</span><h2>رقم الطلب {confirmedNumber}</h2></div><button className="icon-btn" onClick={() => setConfirmedNumber(null)}><X/></button></div><p>وصل الطلب إلى نظام المطعم وسيظهر للكاشير. احتفظ برقم الطلب.</p><button className="primary-btn wide" onClick={() => setConfirmedNumber(null)}>حسناً</button></div></div>}{cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">طلبك الحالي</span><h2>السلة <small>({cartCount})</small></h2></div><button className="icon-btn" onClick={() => setCartOpen(false)}><X/></button></div>{cart.length === 0 ? <div className="empty"><ShoppingBag size={38}/><p>السلة فاضية حالياً</p><button className="text-btn" onClick={() => setCartOpen(false)}>خلّنا نضيف شيء لذيذ</button></div> : <><div className="cart-list">{cart.map(i => <div className="cart-row" key={lineKey(i)}><img src={i.image} alt=""/><div className="cart-row-main"><strong>{i.name}</strong>{i.choices?.length ? <small className="cart-choices">{i.choices.join("، ")}</small> : null}<span>{money(i.price * i.qty)}</span><div className="qty"><button onClick={() => change(lineKey(i), -1)}><Minus size={14}/></button><b>{i.qty}</b><button onClick={() => change(lineKey(i), 1)}><Plus size={14}/></button></div></div><button className="remove" onClick={() => setCart(items => items.filter(x => x.id !== i.id))}><Trash2 size={16}/></button></div>)}</div><div className="cart-total"><span>الإجمالي</span><strong>{money(total)}</strong></div><button className="primary-btn wide" onClick={() => { if (!requestId) setRequestId(crypto.randomUUID()); setOrderError(""); setCheckoutOpen(true); }}>متابعة الطلب <ChevronLeft size={18}/></button></>}</aside></div>}<>{customizing && <div className="overlay"><div className="checkout-modal choice-modal"><div className="drawer-head"><div><span className="eyebrow">تخصيص الساندويتش</span><h2>{customizing.name}</h2></div><button className="icon-btn" onClick={() => setCustomizing(null)}><X/></button></div><p className="choice-help">اختر الإضافات أو المكونات التي تريد تعديلها:</p><div className="choice-list">{customizing.options?.map(option => <label className="choice-item" key={option}><input type="checkbox" checked={selectedChoices.includes(option)} onChange={e => setSelectedChoices(v => e.target.checked ? [...v, option] : v.filter(x => x !== option))}/><span>{option}</span></label>)}</div><button className="primary-btn wide" onClick={() => { addToCart(customizing, selectedChoices); setCustomizing(null); setSelectedChoices([]); }}>إضافة للسلة <Plus size={18}/></button></div></div>}</>{accountOpen && <div className="overlay" onClick={()=>setAccountOpen(false)}><div className="checkout-modal account-modal" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">حساب العميل</span><h2>{customer ? `أهلاً ${customer.name}` : "تسجيل الدخول"}</h2></div><button className="icon-btn" onClick={()=>setAccountOpen(false)}><X/></button></div>{customer ? <><p>أهلاً بك في حسابك. بياناتك وطلباتك محفوظة على قاعدة البيانات ويمكنك فتحها من أي جهاز.</p><div className="previous-orders"><span className="eyebrow">طلباتي السابقة</span>{accountOrders.map((o:any)=><div className="previous-order" key={o.id}><span>طلب رقم {o.orderNumber}<small>{new Date(o.createdAt).toLocaleDateString("ar-KW")} · الحالة: {({new:"جديد",processing:"قيد التجهيز",ready:"جاهز",completed:"مكتمل",cancelled:"ملغي"} as any)[o.status]||o.status}</small><small>{(o.items||[]).map((it:any)=>it.name+" × "+it.qty).join("، ")}</small></span><strong>{Number(o.total).toFixed(3)} د.ك</strong><button className="outline-btn" onClick={()=>{const missing:string[]=[];const additions=(o.items||[]).map((item:any)=>{const product=products.find(p=>String(p.id)===String(item.productId));if(!product||product.hidden||!isAvailable(product)){missing.push(item.name);return null}return {...product,qty:Number(item.qty)||1,choices:Array.isArray(item.choices)?item.choices:[]}}).filter(Boolean) as any[];if(!additions.length){setAccountMessage("الأصناف غير متاحة حالياً لإعادة الطلب.");return}setCart(additions);setAccountMessage(missing.length?"تمت إضافة الأصناف المتاحة فقط: "+missing.join("، "):"تمت إضافة الطلب للسلة بالأسعار الحالية. راجع السلة قبل التأكيد.");setAccountOpen(false);setCartOpen(true)}}>إعادة الطلب</button></div>)}{!accountOrders.length&&<small>لا توجد طلبات مرتبطة بحسابك حتى الآن.</small>}</div><div className="previous-orders"><span className="eyebrow">عناويني المحفوظة</span>{customerAddresses.map((a:any)=><div className="previous-order" key={a.id}><span><strong>{a.label}</strong><small>{[a.areaName,a.block,a.street,a.house].filter(Boolean).join("، ")}</small></span><button className="outline-btn" onClick={async()=>{const r=await fetch("/api/customer/addresses/"+a.id,{method:"DELETE",credentials:"same-origin"});if(r.ok)setCustomerAddresses(v=>v.filter(x=>x.id!==a.id))}}>حذف</button></div>)}<form onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const body={label:String(form.get("label")||""),areaName:String(form.get("areaName")||""),block:String(form.get("block")||""),street:String(form.get("street")||""),house:String(form.get("house")||""),isDefault:customerAddresses.length===0};const r=await fetch("/api/customer/addresses",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body)});const d=await r.json();if(!r.ok){setAccountMessage(d.message||"تعذر حفظ العنوان");return}const me=await fetch("/api/customer/me",{credentials:"same-origin"}).then(x=>x.json());setCustomerAddresses(me.addresses||[]);e.currentTarget.reset();setAccountMessage("تم حفظ العنوان.")}}><label>اسم العنوان<input name="label" required placeholder="البيت أو الشغل"/></label><label>المنطقة<input name="areaName" required/></label><div className="two-cols"><label>القطعة<input name="block"/></label><label>الشارع<input name="street"/></label></div><label>رقم المنزل<input name="house"/></label><button className="outline-btn">إضافة عنوان</button></form>{accountMessage&&<small>{accountMessage}</small>}</div><div className="previous-orders"><span className="eyebrow">تقييم طلب مستلم</span><p>أدخل رقم الطلب ورقم الهاتف المستخدم في الطلب لعرض الأصناف التي يمكنك تقييمها.</p><div className="rating-order-lookup"><input value={ratingOrderNumber} onChange={e=>setRatingOrderNumber(e.target.value)} inputMode="numeric" placeholder="رقم الطلب"/><button className="outline-btn" disabled={ratingLoading||!ratingOrderNumber.trim()} onClick={async()=>{setRatingLoading(true);setRatingMessage("");setRatingItems([]);try{const r=await fetch("/api/product-ratings/order/"+encodeURIComponent(ratingOrderNumber)+"?phone="+encodeURIComponent(customer.phone));const d=await r.json();if(!r.ok)throw new Error(d.message||"تعذر تحميل الطلب");setRatingItems(d.items||[]);if(!(d.items||[]).length)setRatingMessage("لا توجد أصناف للتقييم في هذا الطلب.")}catch(e){setRatingMessage(e instanceof Error?e.message:"تعذر تحميل الطلب")}finally{setRatingLoading(false)}}}>{ratingLoading?"جارٍ التحميل…":"عرض الأصناف"}</button></div>{ratingMessage&&<small>{ratingMessage}</small>}{ratingItems.map(item=><div className="previous-order" key={item.productId}><span>{item.name}</span>{item.rating!==null?<strong>⭐ {item.rating} / 5</strong>:<span className="rating-stars">{[1,2,3,4,5].map(n=><button key={n} aria-label={"تقييم "+n+" من 5"} onClick={async()=>{try{const r=await fetch("/api/product-ratings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderNumber:Number(ratingOrderNumber),phone:customer.phone,productId:item.productId,rating:n})});const d=await r.json();if(!r.ok)throw new Error(d.message||"تعذر حفظ التقييم");setRatingItems(items=>items.map(x=>x.productId===item.productId?{...x,rating:n}:x));setProductRatings(prev=>({...prev,[item.productId]:{average:Number(d.rating.average),count:Number(d.rating.count)}}));setRatingMessage("تم حفظ تقييمك بنجاح.")}catch(e){setRatingMessage(e instanceof Error?e.message:"تعذر حفظ التقييم")}}}>★</button>)}</span>}</div>)}</div><button className="outline-btn" onClick={async()=>{await fetch("/api/customer/logout",{method:"POST",credentials:"same-origin"});setCustomer(null);setCustomerAddresses([]);setAccountOrders([]);setAccountOpen(false)}}>تسجيل الخروج</button></> : <form onSubmit={async e=>{e.preventDefault();setAccountBusy(true);setAccountMessage("");const form=new FormData(e.currentTarget);const body=accountMode==="register"?{name:String(form.get("customerName")||""),email:String(form.get("customerEmail")||""),phone:String(form.get("customerPhone")||""),password:String(form.get("customerPassword")||"")}:{email:String(form.get("customerEmail")||""),password:String(form.get("customerPassword")||"")};try{const r=await fetch("/api/customer/"+accountMode,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.message||"تعذر تسجيل الدخول");setCustomer(d.customer);const me=await fetch("/api/customer/me",{credentials:"same-origin",cache:"no-store"}).then(x=>x.json());setCustomerAddresses(me.addresses||[]);const history=await fetch("/api/customer/orders",{credentials:"same-origin",cache:"no-store"}).then(x=>x.json());setAccountOrders(history.orders||[])}catch(error){setAccountMessage(error instanceof Error?error.message:"تعذر تنفيذ العملية")}finally{setAccountBusy(false)}}}>{accountMode==="register"&&<><label>الاسم الكامل<input name="customerName" required placeholder="الاسم الكامل"/></label><label>رقم الموبايل<input name="customerPhone" required type="tel" placeholder="رقم التواصل"/></label></>}<label>البريد الإلكتروني<input name="customerEmail" type="email" required placeholder="name@example.com"/></label><label>كلمة المرور<input name="customerPassword" type="password" minLength={8} required placeholder="8 أحرف على الأقل"/></label>{accountMessage&&<p className="minimum-warning">{accountMessage}</p>}<button className="primary-btn wide" disabled={accountBusy}>{accountBusy?"جارٍ التنفيذ…":accountMode==="register"?"إنشاء حساب مجاني":"تسجيل الدخول"}</button><button type="button" className="outline-btn wide" onClick={()=>{setAccountMode(v=>v==="login"?"register":"login");setAccountMessage("")}}>{accountMode==="login"?"ليس لديك حساب؟ إنشاء حساب":"لديك حساب بالفعل؟ تسجيل الدخول"}</button></form>}</div></div>}{checkoutOpen && <div className="overlay"><div className="checkout-modal checkout-pro"><div className="drawer-head"><div><span className="eyebrow">خطوة أخيرة</span><h2>{serviceMode === "التوصيل" ? "تفاصيل التوصيل" : "بيانات الاستلام"}</h2></div><button className="icon-btn" onClick={() => setCheckoutOpen(false)}><X/></button></div><div className="checkout-progress"><span className="done">1 السلة</span><i></i><span className="current">2 البيانات</span><i></i><span>3 التأكيد</span></div><div className="checkout-order-mini"><span>{cartCount} أصناف في الطلب</span><strong>{money(total)}</strong></div><form className="checkout-form" onSubmit={sendOrder}><label>الاسم الكامل<input name="name" required defaultValue={customer?.name||""} placeholder="مثال: أحمد محمد"/></label><label>رقم الموبايل<input name="phone" required type="tel" defaultValue={customer?.phone||""} placeholder="رقم التواصل"/></label><label>طريقة الدفع<select name="payment" defaultValue="الدفع عند الاستلام"><option>الدفع عند الاستلام</option><option>K-Net</option><option>بطاقة ائتمان</option></select></label>{serviceMode === "التوصيل" && <> <label>منطقة التوصيل<select name="zone" required value={deliveryZone} onChange={e => setDeliveryZone(e.target.value)}><option value="">اختر المنطقة</option>{zones.map((z) => <option key={String(z.id ?? z.name)} value={String(z.id ?? z.name)}>{z.name} — توصيل {money(z.fee)} — الحد {money(Number(z.minimumOrder || 0))}</option>)}</select></label><div className="two-cols"><label>القطعة<input name="block" required placeholder="رقم القطعة"/></label><label>الشارع<input name="street" required placeholder="رقم أو اسم الشارع"/></label></div><label>الجادة <span className="optional">اختياري</span><input name="avenue" placeholder="رقم الجادة"/></label><label>رقم المنزل<input name="house" required placeholder="رقم المنزل"/></label><div className="two-cols"><label>الدور <span className="optional">اختياري</span><input name="floor" placeholder="رقم الدور"/></label><label>الشقة <span className="optional">اختياري</span><input name="apartment" placeholder="رقم الشقة"/></label></div> </>}<label>ملاحظات الطلب <span className="optional">اختياري</span><textarea name="notes" placeholder="بدون بصل، الصوص جانباً..."/></label><div className="checkout-summary"><div><span>قيمة الطعام</span><small>{money(total)}</small><span>التوصيل</span><small>{serviceMode === "التوصيل" ? (deliveryZone ? money(deliveryFee) : "—") : money(0)}</small></div><strong>{money(grandTotal)}</strong></div>{serviceMode === "التوصيل" && total < minOrder && <p className="minimum-warning">الحد الأدنى للطلب هو {money(minOrder)}، يرجى إضافة منتجات أخرى لإتمام الطلب.</p>}{orderError && <p className="minimum-warning">{orderError}</p>}<button className="primary-btn wide checkout-submit" type="submit">تأكيد الطلب <ArrowLeft size={18}/></button><p className="microcopy">سيتم إرسال الطلب مباشرة إلى المطعم.</p></form></div></div>}</div>;
}

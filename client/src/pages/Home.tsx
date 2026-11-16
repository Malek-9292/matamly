import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, Menu, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";

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
const applyVisualSettings = () => { const paletteVersion="global-green-v1"; if(localStorage.getItem("matamly_palette_version")!==paletteVersion){localStorage.setItem("matamly_palette_version",paletteVersion);localStorage.setItem("matamly_theme","warm");localStorage.setItem("matamly_primary_color","#123C2F");localStorage.setItem("matamly_accent_color","#C85A3F");localStorage.setItem("matamly_bg_color","#F6F2E9");localStorage.setItem("matamly_header_color","#FFFDF8");localStorage.setItem("matamly_footer_color","#0B2B22");localStorage.setItem("matamly_edge_color","#F6F2E9");localStorage.setItem("matamly_offer_bg_color","#123C2F");localStorage.setItem("matamly_offer_text_color","#FFFFFF");} const root = document.documentElement; const themes: Record<string, {primary:string; accent:string; bg:string; paper:string}> = { warm: {primary:"#31422c", accent:"#bb5b3b", bg:"#f3efe5", paper:"#fffefa"}, charcoal: {primary:"#20252b", accent:"#d38b3d", bg:"#eef0f2", paper:"#ffffff"}, ocean: {primary:"#154b5c", accent:"#d36b4f", bg:"#e8f1f2", paper:"#ffffff"}, rose: {primary:"#633b4e", accent:"#bf6b70", bg:"#f7edef", paper:"#fffafb"}, sunset: {primary:"#66352c", accent:"#e09a3e", bg:"#fff1df", paper:"#fffaf3"}, mint: {primary:"#20564c", accent:"#d18b62", bg:"#e7f3ed", paper:"#fbfffc"}, lavender: {primary:"#4b4168", accent:"#9b6fc3", bg:"#f1eef9", paper:"#fffaff"}, midnight: {primary:"#172032", accent:"#e0a548", bg:"#e9edf4", paper:"#ffffff"} }; const t = themes[localStorage.getItem("matamly_theme") || "warm"] || themes.warm; root.style.setProperty("--olive", localStorage.getItem("matamly_primary_color") || t.primary); root.style.setProperty("--terracotta", localStorage.getItem("matamly_accent_color") || t.accent); root.style.setProperty("--cream", localStorage.getItem("matamly_bg_color") || t.bg); root.style.setProperty("--paper", localStorage.getItem("matamly_paper_color") || t.paper); root.style.setProperty("--header-size", `${localStorage.getItem("matamly_header_size") || 76}px`); root.style.setProperty("--footer-size", `${localStorage.getItem("matamly_footer_size") || 64}px`); root.style.setProperty("--header-color", localStorage.getItem("matamly_header_color") || t.paper); root.style.setProperty("--footer-color", localStorage.getItem("matamly_footer_color") || t.primary); root.style.setProperty("--edge-color", localStorage.getItem("matamly_edge_color") || "#176f69"); const radii: Record<string,string> = {soft:"14px", square:"3px", pill:"28px"}; root.style.setProperty("--radius", radii[localStorage.getItem("matamly_shape") || "soft"] || "14px"); root.style.setProperty("--hero-height", `${localStorage.getItem("matamly_hero_size") || 330}px`); root.style.setProperty("--category-card-height", `${localStorage.getItem("matamly_category_card_height") || 150}px`); root.style.setProperty("--category-card-radius", localStorage.getItem("matamly_category_card_shape") || "14px"); };
const applyTrackingPixels = () => { const meta = localStorage.getItem("matamly_meta_pixel"); if (meta && !(window as any).fbq) { const w:any=window; const n:any=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)}; n.queue=[]; n.version="2.0"; w.fbq=n; const script=document.createElement("script"); script.async=true; script.src="https://connect.facebook.net/en_US/fbevents.js"; document.head.appendChild(script); n("init",meta); n("track","PageView"); } else if(meta && (window as any).fbq) (window as any).fbq("track","PageView"); const tiktok = localStorage.getItem("matamly_tiktok_pixel"); if(tiktok && !document.getElementById("tiktok-pixel")){ const script=document.createElement("script"); script.id="tiktok-pixel"; script.innerHTML=`!function (w, d, t) { w.TiktokAnalyticsObject=t; var ttq=w[t]=w[t]||[]; ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"]; ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]); ttq.instance=function(t){var e=ttq._i[t]||[]; return ttq._i[t]=e}; ttq.load('${tiktok}'); ttq.page(); }(window, document, 'ttq');`; document.head.appendChild(script); } const twitter = localStorage.getItem("matamly_twitter_pixel"); if(twitter && !(window as any).twq){ const script=document.createElement("script"); script.innerHTML=`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version="1.1",s.queue=[],u=t.createElement(n),u.async=!0,u.src="https://static.ads-twitter.com/uwt.js",a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,"script"); twq("config","${twitter}");`; document.head.appendChild(script); } };

export default function Home() {
  const [categoryImageVersion,setCategoryImageVersion] = useState(0); const [heroImage, setHeroImage] = useState(localStorage.getItem("matamly_hero_image") ?? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=90"); const heroVisible = localStorage.getItem("matamly_hero_visible") !== "0"; const heroTitle = localStorage.getItem("matamly_hero_title") || "وجبتك المفضلة على مزاجك."; const heroSubtitle = localStorage.getItem("matamly_hero_subtitle") || "نحضّرها طازجة، نرتّبها بحب، ونوصلها لبابك. اطلب مباشرة من القائمة بدون تطبيقات وسيطة."; const heroKicker = localStorage.getItem("matamly_hero_kicker") || "مطبخ محلي بطابع أصيل"; const heroTextColor = localStorage.getItem("matamly_hero_text_color") || "#31422c"; const heroBgColor = localStorage.getItem("matamly_hero_bg_color") || ""; const featuredVisible = localStorage.getItem("matamly_featured_visible") !== "0"; const offerVisible = localStorage.getItem("matamly_offer_visible") !== "0"; const offerTitle = localStorage.getItem("matamly_offer_title") || "عرض الأسبوع"; const offerSubtitle = localStorage.getItem("matamly_offer_subtitle") || "خصم خاص لفترة محدودة"; const offerBadge = localStorage.getItem("matamly_offer_badge") || "خصم 15%"; const offerImage = localStorage.getItem("matamly_offer_image") || ""; const offerTextColor = localStorage.getItem("matamly_offer_text_color") || "#ffffff"; const offerBgColor = localStorage.getItem("matamly_offer_bg_color") || "#176f69"; const [language, setLanguage] = useState<"ar"|"en">(() => (localStorage.getItem("matamly_language") as "ar"|"en") || "ar"); const tr = (ar:string,en:string) => language === "ar" ? ar : en; const [products, setProducts] = useState<Product[]>(() => getProducts().filter(p => !p.hidden));
  const [layout, setLayout] = useState(localStorage.getItem("matamly_layout") || "classic"); const [category, setCategory] = useState(()=>new URLSearchParams(window.location.search).get("category") || "الكل"); const [sortMode,setSortMode]=useState("popular"); const [deliveryZone, setDeliveryZone] = useState(""); const zones = getZones(); const minOrder = Number(localStorage.getItem("matamly_min_order") || 3); const deliveryFee = zones.find((z: {name:string;fee:number}) => z.name === deliveryZone)?.fee || 0; const [cart, setCart] = useState<CartItem[]>([]); const [customizing, setCustomizing] = useState<Product | null>(null); const [selectedChoices, setSelectedChoices] = useState<string[]>([]); const [cartOpen, setCartOpen] = useState(false); const [checkoutOpen, setCheckoutOpen] = useState(false); const [sent, setSent] = useState(false); const [justAdded,setJustAdded]=useState<number|null>(null);
  const [serviceMode, setServiceMode] = useState(localStorage.getItem("matamly_service_mode") || "التوصيل"); const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const [accountOpen, setAccountOpen] = useState(false); const [customer, setCustomer] = useState<{name:string;phone:string} | null>(() => { try { return JSON.parse(localStorage.getItem("matamly_customer") || "null"); } catch { return null; } }); const [restaurant, setRestaurant] = useState(() => setting("matamly_name", "مطعمي")); const [logo, setLogo] = useState(() => localStorage.getItem("matamly_logo") || "");
  const menuCategories = getCategoryOrder(); const categories = ["الكل", ...menuCategories]; const categoryImages = getCategoryImages(); const featuredProducts = products.filter(p => p.featured).slice(0, 8); const filtered = category === "الكل" ? products : products.filter(p => p.category === category); const displayProducts = [...filtered].sort((a,b)=>sortMode === "price-asc" ? a.price-b.price : sortMode === "price-desc" ? b.price-a.price : Number(Boolean(b.featured))-Number(Boolean(a.featured))).slice(0,10); const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]); const contactPhones = [localStorage.getItem("matamly_phone1") || "", localStorage.getItem("matamly_phone2") || ""].filter(Boolean);
  useEffect(() => { localStorage.setItem("matamly_language", language); document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }, [language]);
  useEffect(() => { fetch("/api/settings", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (data?.settings && typeof data.settings === "object") { for (const [key, value] of Object.entries(data.settings)) if (key.startsWith("matamly_") && typeof value === "string") localStorage.setItem(key, value); applyVisualSettings(); setRestaurant(setting("matamly_name", "مطعمي")); setLogo(localStorage.getItem("matamly_logo") || ""); setLayout(localStorage.getItem("matamly_layout") || "classic"); setHeroImage(localStorage.getItem("matamly_hero_image") || "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=90"); } }).catch(() => undefined); fetch("/api/menu", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (Array.isArray(data?.products) && data.products.length) { localStorage.setItem("matamly_products", JSON.stringify(data.products)); setProducts(data.products.filter((p: Product) => !p.hidden)); } }).catch(() => undefined); applyVisualSettings(); applyTrackingPixels(); if (!sessionStorage.getItem("matamly_seen")) { sessionStorage.setItem("matamly_seen", "1"); localStorage.setItem("matamly_visits", String(Number(localStorage.getItem("matamly_visits") || 0) + 1)); } const onStorage = () => { setProducts(getProducts().filter(p => !p.hidden)); setRestaurant(setting("matamly_name", "مطعمي")); setLogo(localStorage.getItem("matamly_logo") || ""); setLayout(localStorage.getItem("matamly_layout") || "classic"); setHeroImage(localStorage.getItem("matamly_hero_image") ?? "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=90"); setCategoryImageVersion(v=>v+1); applyVisualSettings(); applyTrackingPixels(); }; window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage); }, []);
  useEffect(() => { const items = Array.from(document.querySelectorAll<HTMLElement>(".site-shell .menu-section, .site-shell .offer-banner, .site-shell .promise, .site-shell .contact-panel, .site-shell .product-card, .site-shell .category-cards button")); items.forEach((el,i)=>{el.classList.add("motion-item"); el.style.setProperty("--motion-delay", `${Math.min(i%8,7)*55}ms`);}); const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible"); observer.unobserve(entry.target);}}),{threshold:.12,rootMargin:"0px 0px -35px 0px"}); items.forEach(el=>observer.observe(el)); return ()=>observer.disconnect(); }, []);
  useEffect(() => { const onPopState=()=>setCategory(new URLSearchParams(window.location.search).get("category") || "الكل"); window.addEventListener("popstate",onPopState); return ()=>window.removeEventListener("popstate",onPopState); }, []);
  const addToCart = (p: Product, choices: string[] = []) => { if ((window as any).fbq) (window as any).fbq("track","AddToCart",{content_name:p.name,value:p.price,currency:"KWD"}); return setCart(items => { const found = items.find(i => i.id === p.id && JSON.stringify(i.choices || []) === JSON.stringify(choices)); return found ? items.map(i => i.id === p.id && JSON.stringify(i.choices || []) === JSON.stringify(choices) ? { ...i, qty: i.qty + 1 } : i) : [...items, { ...p, qty: 1, choices }]; }); }; const add = (p: Product) => { if ((p.category === "السندويشات الخفيفة" || p.category === "السندويشات الحارة والباردة" || p.category === "سندويشات الصاج" || p.category === "أفطار الخالدية (المقبلات والسلطات)" || p.category === "صواني مشويات") && p.options?.length) { setCustomizing(p); setSelectedChoices([]); } else addToCart(p); };
  const quickAdd = (p: Product) => { add(p); setJustAdded(p.id); window.setTimeout(()=>setJustAdded(id=>id===p.id?null:id),700); };
  const change = (id: number, delta: number) => setCart(items => items.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0); const grandTotal = total + deliveryFee; const whatsapp = localStorage.getItem("matamly_whatsapp") || "966500000000";
  const sendOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (serviceMode === "التوصيل" && total < minOrder) { alert(`الحد الأدنى للطلب هو ${money(minOrder)}، يرجى إضافة منتجات أخرى لإتمام الطلب`); return; }
    if (serviceMode === "التوصيل" && !deliveryZone) { alert("يرجى اختيار منطقة التوصيل"); return; }

    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const payment = String(data.get("payment") || "الدفع عند الاستلام");
    const block = String(data.get("block") || "");
    const street = String(data.get("street") || "");
    const avenue = String(data.get("avenue") || "");
    const floor = String(data.get("floor") || "");
    const apartment = String(data.get("apartment") || "");
    const house = String(data.get("house") || "");
    const notes = String(data.get("notes") || "");
    const address = serviceMode === "التوصيل" ? `${deliveryZone} - رسوم التوصيل ${money(deliveryFee)} - القطعة ${block} - الشارع ${street} - الجادة ${avenue} - الدور ${floor} - رقم الشقة ${apartment} - رقم المنزل ${house}` : "استلام من المطعم";

    // Open the tab while the user gesture is still active so mobile browsers do not block it.
    const whatsappWindow = window.open("about:blank", "_blank");
    let confirmedItems = cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, choices: i.choices || [] }));
    let confirmedFoodTotal = total;
    let confirmedGrandTotal = grandTotal;
    try {
      const savedOrder = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: { name, phone }, items: confirmedItems, deliveryFee: serviceMode === "التوصيل" ? deliveryFee : 0, zone: serviceMode === "التوصيل" ? deliveryZone : "", address, notes, payment, serviceMode }),
      });
      const result = await savedOrder.json().catch(() => ({}));
      if (savedOrder.status === 400) {
        whatsappWindow?.close();
        alert(result.message || "تعذر اعتماد الطلب. حدّث القائمة وحاول مرة أخرى.");
        return;
      }
      if (!savedOrder.ok) throw new Error("تعذر تسجيل الطلب داخل النظام");
      if (Array.isArray(result.items)) confirmedItems = result.items;
      if (Number.isFinite(Number(result.foodTotal))) confirmedFoodTotal = Number(result.foodTotal);
      if (Number.isFinite(Number(result.total))) confirmedGrandTotal = Number(result.total);
    } catch {
      alert("تنبيه: تعذر تسجيل الطلب داخل نظام المطعم حالياً. سيتم فتح واتساب، لكن قد لا يظهر الطلب في شاشة الكاشير.");
    }

    const lines = confirmedItems.map(i => `• ${i.name}${i.choices?.length ? ` (${i.choices.join("، ")})` : ""} × ${i.qty} — ${money(i.price * i.qty)}`).join("%0A");
    const message = `*طلب جديد من ${encodeURIComponent(restaurant)}*%0A%0Aطريقة الاستلام: ${encodeURIComponent(serviceMode)}%0A%0Aالعميل: ${encodeURIComponent(name)}%0Aرقم الموبايل: ${encodeURIComponent(phone)}%0Aطريقة الدفع: ${encodeURIComponent(payment)}%0A%0A*الأصناف*%0A${lines}%0A%0Aقيمة الطعام: ${money(confirmedFoodTotal)}%0Aالتوصيل: ${money(deliveryFee)}%0Aالإجمالي: *${money(confirmedGrandTotal)}*%0Aالعنوان: ${encodeURIComponent(address)}%0Aملاحظات: ${encodeURIComponent(notes || "لا توجد")}`;
    const whatsappUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${message}`;
    if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
    else alert("المتصفح منع فتح واتساب. اضغط على زر واتساب مرة أخرى أو اسمح بالنوافذ المنبثقة.");
    if ((window as any).fbq) (window as any).fbq("track", "Purchase", { value: confirmedGrandTotal, currency: "KWD" });
    localStorage.setItem("matamly_orders", String(Number(localStorage.getItem("matamly_orders") || 0) + 1));
    localStorage.setItem("matamly_last_order", new Date().toISOString());
    const history = JSON.parse(localStorage.getItem("matamly_order_history") || "[]");
    history.unshift({ date: new Date().toLocaleString("ar-KW"), total: confirmedGrandTotal, items: confirmedItems.map(i => `${i.name} × ${i.qty}`) });
    localStorage.setItem("matamly_order_history", JSON.stringify(history.slice(0, 20)));
    setSent(true); setCart([]); setCheckoutOpen(false); setCartOpen(false);
  };

  return <div className={`site-shell layout-${layout} ${category!=="الكل"?"category-page":""}`}><div className="service-strip"><span>{tr("طريقة الاستلام","Order method")}</span><div>{["التوصيل","استلام من المطعم"].map(mode=><button key={mode} className={serviceMode===mode?"active":""} onClick={()=>{setServiceMode(mode);localStorage.setItem("matamly_service_mode",mode)}}>{language === "ar" ? mode : mode === "التوصيل" ? "Delivery" : "Restaurant pickup"}</button>)}</div></div><header className="topbar"><div className="brand">{logo ? <img src={logo} alt="" className="brand-logo"/> : <span className="brand-mark">✦</span>}<span>{restaurant}</span><small>طعم البيت، أسرع</small></div><nav className={mobileMenuOpen ? "mobile-nav-open" : ""}><select className="section-select" value={category} onChange={e=>{setCategory(e.target.value);setMobileMenuOpen(false);document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}}><option value="الكل">{tr("الأقسام","Categories")}</option>{categories.filter(c=>c!=="الكل").map(c=><option key={c} value={c}>{c}</option>)}</select></nav><button className="language-toggle" onClick={()=>setLanguage(v=>v==="ar"?"en":"ar")} aria-label="تغيير اللغة">{language === "ar" ? "EN" : "عربي"}</button><button className="mobile-menu-btn" aria-label={tr("فتح القائمة","Open menu")} onClick={()=>setMobileMenuOpen(v=>!v)}><Menu size={22}/></button><button className="account-trigger" onClick={()=>setAccountOpen(true)}>◯ <span>{customer?.name || tr("حسابي","Account")}</span></button><button className="cart-trigger" onClick={() => setCartOpen(true)}><ShoppingBag size={19}/><span>{tr("السلة","Cart")}</span>{cartCount > 0 && <b>{cartCount}</b>}</button></header><main>{heroVisible && <section className="hero" id="story" style={{background:heroBgColor || undefined}}><div className="hero-copy" style={{color:heroTextColor}}><span className="eyebrow"><Sparkles size={15}/> {heroKicker}</span><h1>{heroTitle}</h1><p>{heroSubtitle}</p><a className="primary-btn" href="#menu">{tr("تصفّح القائمة","Browse menu")} <ArrowLeft size={18}/></a><div className="hero-note"><span className="avatar-stack"><i>م</i><i>س</i><i>ر</i></span><span>+2,400 {tr("طلب سعيد هذا الشهر","happy orders this month")}</span></div></div><div className="hero-art"><div className="art-stamp">{tr("طازج","Fresh")}<br/><strong>{tr("كل يوم","Every day")}</strong></div>{heroImage ? <img src={heroImage} alt="صورة المطعم الرئيسية"/> : <div className="image-placeholder">أضف صورة البانر من لوحة الأدمن</div>}<div className="art-caption"><span>01</span><strong>من مطبخنا<br/>إلى سفرتك</strong></div></div></section>}{featuredVisible && <section className="menu-section featured-section" id="featured"><div className="section-heading"><div><span className="eyebrow">{tr("اختيارات الزبائن","Customer picks")}</span><h2>{tr("الأكثر طلباً","Best sellers")}</h2></div><span className="muted">{tr("أصناف يحبها زبائننا","Loved by our customers")}</span></div><div className="product-grid">{featuredProducts.map(p => <article className="product-card" key={`featured-${p.id}`}><div className="product-image"><span className="badge">الأكثر طلباً</span>{p.image ? <img src={p.image} alt={p.name}/> : <div className="image-placeholder">صورة الصنف لاحقاً</div>}<div className="product-actions"><button className="add-float" disabled={!isAvailable(p)} onClick={() => add(p)} aria-label="إضافة خيارات"><Plus size={19}/></button><button className="cart-float" disabled={!isAvailable(p)} onClick={() => quickAdd(p)} aria-label="إضافة للسلة"><ShoppingBag size={17}/></button></div></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.description}</p></div><strong>{money(p.price)}</strong><button className={`quick-add-btn ${justAdded===p.id?"is-added":""}`} onClick={()=>quickAdd(p)}>{justAdded===p.id?"تمت الإضافة ✓":p.options?.length?"اختيارات":"إضافة سريعة +"}</button></div></article>)}</div></section>}{offerVisible && <section className="offer-banner" style={{background:offerBgColor,color:offerTextColor}}><div className="offer-banner-copy"><span className="eyebrow">{offerBadge}</span><h2>{offerTitle}</h2><p>{offerSubtitle}</p><button onClick={()=>document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}>تصفح العروض <ArrowLeft size={17}/></button></div>{offerImage && <img src={offerImage} alt="العرض الخاص"/>}</section>}<section className="menu-section" id="menu"><div className="section-heading"><div><span className="eyebrow">{tr("اختر ما تشتهي","Choose what you crave")}</span><h2>{category === "الكل" ? "قائمة اليوم" : category}</h2>{category !== "الكل" && <label className="sort-control">ترتيب المنتجات<select value={sortMode} onChange={e=>setSortMode(e.target.value)}><option value="popular">الأكثر طلباً</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option></select></label>}{category !== "الكل" && <button className="back-to-menu" onClick={()=>{setCategory("الكل");history.pushState({},"","/");window.scrollTo({top:0,behavior:"smooth"})}}>← العودة إلى كل الأقسام</button>}</div><span className="muted">{tr("توصيل سريع · دفع عند الاستلام","Fast delivery · Cash on delivery")}</span></div><div className="category-tabs category-cards">{categories.map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => {setCategory(c); history.pushState({},"",c==="الكل"?"/":`/?category=${encodeURIComponent(c)}`); window.scrollTo({top:0,behavior:"smooth"})}}>{c !== "الكل" && categoryImages[c] ? <img src={categoryImages[c]} alt=""/> : <span className="category-placeholder">{c === "الكل" ? "✦" : c.slice(0,1)}</span>}<span>{c}</span></button>)}</div><div className="product-grid">{displayProducts.map(p => <article className="product-card" key={p.id}><div className="product-image">{p.badge && <span className="badge">{p.badge}</span>}{p.image ? <img src={p.image} alt={p.name}/> : <div className="image-placeholder">صورة الصنف لاحقاً</div>}<div className="product-actions"><button className="add-float" disabled={!isAvailable(p)} onClick={() => add(p)} aria-label="إضافة خيارات"><Plus size={19}/></button><button className="cart-float" disabled={!isAvailable(p)} onClick={() => quickAdd(p)} aria-label="إضافة للسلة"><ShoppingBag size={17}/></button></div></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.description}</p>{p.availableFrom && p.availableTo && !isAvailable(p) && <small className="availability-note">متاح من {p.availableFrom} إلى {p.availableTo}</small>}</div><strong>{money(p.price)}</strong><button className={`quick-add-btn ${justAdded===p.id?"is-added":""}`} onClick={()=>quickAdd(p)}>{justAdded===p.id?"تمت الإضافة ✓":p.options?.length?"اختيارات":"إضافة سريعة +"}</button></div></article>)}</div></section><section className="contact-panel" id="contact"><div><span className="eyebrow">{tr("تواصل معنا","Contact us")}</span><h2>مطعم فتوش الخالدية</h2><p>{tr("اطلب وجبتك مباشرة وتابع طلباتك من حسابك.","Order directly and follow your orders from your account.")}</p></div><div className="contact-actions">{contactPhones.map(phone=><a key={phone} href={`tel:${phone}`}>اتصال: {phone}</a>)}<button onClick={()=>document.getElementById("menu")?.scrollIntoView({behavior:"smooth"})}>{tr("الأقسام ▾","Categories ▾")}</button><button onClick={()=>setAccountOpen(true)}>{tr("حساب العميل","Customer account")}</button></div></section></main><footer><span>© 2026 {restaurant}</span><span>{tr("جميع الحقوق محفوظة — إنشاء م/ محمد فتحي","All rights reserved — Created by Eng. Mohamed Fathy")}</span></footer>{sent && <div className="toast"><Check size={18}/> تم تجهيز طلبك في واتساب</div>}{cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">طلبك الحالي</span><h2>السلة <small>({cartCount})</small></h2></div><button className="icon-btn" onClick={() => setCartOpen(false)}><X/></button></div>{cart.length === 0 ? <div className="empty"><ShoppingBag size={38}/><p>السلة فاضية حالياً</p><button className="text-btn" onClick={() => setCartOpen(false)}>خلّنا نضيف شيء لذيذ</button></div> : <><div className="cart-list">{cart.map(i => <div className="cart-row" key={i.id}><img src={i.image} alt=""/><div className="cart-row-main"><strong>{i.name}</strong>{i.choices?.length ? <small className="cart-choices">{i.choices.join("، ")}</small> : null}<span>{money(i.price * i.qty)}</span><div className="qty"><button onClick={() => change(i.id, -1)}><Minus size={14}/></button><b>{i.qty}</b><button onClick={() => change(i.id, 1)}><Plus size={14}/></button></div></div><button className="remove" onClick={() => setCart(items => items.filter(x => x.id !== i.id))}><Trash2 size={16}/></button></div>)}</div><div className="cart-total"><span>الإجمالي</span><strong>{money(total)}</strong></div><button className="primary-btn wide" onClick={() => setCheckoutOpen(true)}>متابعة الطلب <ChevronLeft size={18}/></button></>}</aside></div>}<>{customizing && <div className="overlay"><div className="checkout-modal choice-modal"><div className="drawer-head"><div><span className="eyebrow">تخصيص الساندويتش</span><h2>{customizing.name}</h2></div><button className="icon-btn" onClick={() => setCustomizing(null)}><X/></button></div><p className="choice-help">اختر الإضافات أو المكونات التي تريد تعديلها:</p><div className="choice-list">{customizing.options?.map(option => <label className="choice-item" key={option}><input type="checkbox" checked={selectedChoices.includes(option)} onChange={e => setSelectedChoices(v => e.target.checked ? [...v, option] : v.filter(x => x !== option))}/><span>{option}</span></label>)}</div><button className="primary-btn wide" onClick={() => { addToCart(customizing, selectedChoices); setCustomizing(null); setSelectedChoices([]); }}>إضافة للسلة <Plus size={18}/></button></div></div>}</>{accountOpen && <div className="overlay" onClick={()=>setAccountOpen(false)}><div className="checkout-modal account-modal" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">حساب العميل</span><h2>{customer ? `أهلاً ${customer.name}` : "تسجيل الدخول"}</h2></div><button className="icon-btn" onClick={()=>setAccountOpen(false)}><X/></button></div>{customer ? <><p>تم حفظ بياناتك على هذا الجهاز لتسهيل الطلبات القادمة.</p><div className="previous-orders"><span className="eyebrow">طلباتي السابقة</span>{JSON.parse(localStorage.getItem("matamly_order_history") || "[]").slice(0,5).map((o:any,i:number)=><div className="previous-order" key={i}><span>{o.date}</span><strong>{Number(o.total).toFixed(3)} د.ك</strong></div>)}{JSON.parse(localStorage.getItem("matamly_order_history") || "[]").length===0&&<small>لا توجد طلبات سابقة بعد.</small>}</div><button className="outline-btn" onClick={()=>{localStorage.removeItem("matamly_customer");setCustomer(null);setAccountOpen(false)}}>تسجيل الخروج</button></> : <form onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);const c={name:String(d.get("customerName")||""),phone:String(d.get("customerPhone")||"")};localStorage.setItem("matamly_customer",JSON.stringify(c));setCustomer(c);setAccountOpen(false)}}><label>الاسم<input name="customerName" required placeholder="الاسم الكامل"/></label><label>رقم الموبايل<input name="customerPhone" required type="tel" placeholder="05xxxxxxxx"/></label><button className="primary-btn wide">دخول / إنشاء حساب</button></form>}</div></div>}{checkoutOpen && <div className="overlay"><div className="checkout-modal checkout-pro"><div className="drawer-head"><div><span className="eyebrow">خطوة أخيرة</span><h2>تفاصيل التوصيل</h2></div><button className="icon-btn" onClick={() => setCheckoutOpen(false)}><X/></button></div><div className="checkout-progress"><span className="done">1 السلة</span><i></i><span className="current">2 البيانات</span><i></i><span>3 التأكيد</span></div><div className="checkout-order-mini"><span>{cartCount} أصناف في الطلب</span><strong>{money(total)}</strong></div><form className="checkout-form" onSubmit={sendOrder}><label>الاسم الكامل<input name="name" required placeholder="مثال: أحمد محمد"/></label><label>رقم الموبايل<input name="phone" required type="tel" placeholder="05xxxxxxxx"/></label><label>طريقة الدفع<select name="payment" defaultValue="الدفع عند الاستلام"><option>الدفع عند الاستلام</option><option>K-Net</option><option>بطاقة ائتمان</option></select></label>{serviceMode === "التوصيل" && <> <label>منطقة التوصيل<select name="zone" required value={deliveryZone} onChange={e => setDeliveryZone(e.target.value)}><option value="">اختر المنطقة</option>{zones.map((z: {name:string;fee:number}) => <option key={z.name} value={z.name}>{z.name} — توصيل {money(z.fee)}</option>)}</select></label><div className="two-cols"><label>القطعة<input name="block" required placeholder="مثال: 4"/></label></div><div className="two-cols"><label>الشارع<input name="street" required placeholder="اسم الشارع"/></label><label>الجادة<input name="avenue" required placeholder="مثال: جادة 2"/></label></div><div className="two-cols"><label>الدور<input name="floor" required placeholder="مثال: 3"/></label><label>رقم الشقة<input name="apartment" required placeholder="مثال: 12"/></label></div><label>رقم المنزل<input name="house" required placeholder="رقم المنزل"/></label> </>}<label>ملاحظات الطلب <span className="optional">اختياري</span><textarea name="notes" placeholder="بدون بصل، الصوص جانباً..."/></label><div className="checkout-summary"><div><span>قيمة الطعام</span><small>{money(total)}</small><span>التوصيل</span><small>{serviceMode === "التوصيل" ? (deliveryZone ? money(deliveryFee) : "—") : money(0)}</small></div><strong>{money(grandTotal)}</strong></div>{serviceMode === "التوصيل" && total < minOrder && <p className="minimum-warning">الحد الأدنى للطلب هو {money(minOrder)}، يرجى إضافة منتجات أخرى لإتمام الطلب.</p>}<button className="primary-btn wide checkout-submit" type="submit">تأكيد الطلب <ArrowLeft size={18}/></button><p className="microcopy">سيتم فتح واتساب برسالة مرتبة وجاهزة للإرسال.</p></form></div></div>}</div>;
}

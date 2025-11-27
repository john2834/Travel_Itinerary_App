// 預設資料 (若 LocalStorage 為空則使用此資料)
const defaultTripData = {
    title: "🇯🇵 日本東京五日遊範本",
    heroImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000",
    days: [
        {
            date: "2024-04-01",
            items: [
                {
                    id: "loc_1",
                    name: "成田機場",
                    startTime: "10:00",
                    endTime: "11:00",
                    address: "千葉県成田市古込1-1",
                    mapLink: "https://maps.google.com/?q=Narita+Airport",
                    note: "入境後記得去買西瓜卡，B1 搭乘 Skyliner。"
                },
                {
                    id: "loc_2",
                    name: "上野飯店 Check-in",
                    startTime: "12:30",
                    endTime: "13:30",
                    address: "東京都台東區上野 1-1-1",
                    mapLink: "https://maps.google.com",
                    note: "寄放行李。"
                },
                {
                    id: "loc_3",
                    name: "晴空塔購物",
                    startTime: "15:00",
                    endTime: "18:00",
                    address: "東京都墨田區押上1-1-2",
                    mapLink: "https://www.google.com/maps/search/?api=1&query=Tokyo+Skytree",
                    note: "主要去買伴手禮，記得去 3F 找寶可夢中心。",
                    
                    // 新增：Level 2 的「詳細說明」
                    description: "這裡很大，建議先去服務台拿地圖。退稅櫃台在 1F，記得帶護照。",

                    transport: {
                        type: "地鐵",
                        info: "搭乘淺草線至押上站，B3 出口直達。\n票價：180日圓\n備註：這班車人很多，小心錢包。",
                        mapLink: "https://goo.gl/maps/example_station" // 新增
                    },
                    // 修改：將 detailNote 改為自訂清單陣列 (Array)
                    customLists: [
                        { title: "必買清單", content: "1. 東京香蕉\n2. 豹紋蛋糕" },
                        { title: "美食備案", content: "若敘敘苑太多人，改吃 6F 壽司" }
                    ]
                }
            ]
        },
        {
            date: "2024-04-02",
            items: []
        }
    ]
};
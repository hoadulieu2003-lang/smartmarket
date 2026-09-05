/**
 * LIVE SYNCHRONIZED MARKET FIXTURE — CHỢ ĐỒNG XUÂN (DEMO)
 * Schema Version: 3.2.0
 * Đã đồng bộ 100% từ hệ thống live: https://ql.chothongminh.top/
 * Market ID: 30000000-0000-4000-8000-000000000002
 * Coordinates: 1200 x 800 standard canvas
 */

import { FloorEntity, ZoneEntity, StallEntity, LocalCoordinateSystem } from '@/spatial/model/types';

export const LIVE_COORDINATE_SYSTEM: LocalCoordinateSystem = {
  width: 1200,
  height: 800,
  origin: 'top_left',
  xAxisDirection: 'east',
  yAxisDirection: 'south',
  zAxisDirection: 'up',
  unit: 'metric_cm',
  scaleFactorToMeters: 0.1,
  rotationConvention: {
    unit: 'degrees',
    defaultDirection: 'clockwise_from_north',
    zeroDegreeAxis: 'north'
  }
};

export const LIVE_MARKET_METADATA = {
  id: "30000000-0000-4000-8000-000000000002",
  code: "CHO-DX-HN",
  name: "Chợ Đồng Xuân (Demo)",
  address: "Đồng Xuân, Hoàn Kiếm, Hà Nội",
  latitude: 21.0378,
  longitude: 105.8492,
  mapLink: "/maps/cho-dx-hn-map.svg",
  coverImage: "/images/market-cho-dx-hn.jpg",
  totalStalls: 50,
  occupiedStalls: 24,
  vacantStalls: 21,
  reservedStalls: 5,
  complaintStalls: 15
};

export const LIVE_ZONES: ZoneEntity[] = [
  {
    "id": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "code": "A",
    "floorId": "floor_live_dx",
    "name": "Khu A - Rau củ quả",
    "subTitle": "Rau củ quả",
    "category": "Rau củ quả",
    "geometry": {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 1100,
      "height": 700
    },
    "boundingBox": {
      "minX": 50,
      "minY": 50,
      "maxX": 1150,
      "maxY": 750,
      "width": 1100,
      "height": 700
    },
    "visualTheme": {
      "colorToken": "#076C31"
    },
    "totalStallsCount": 10,
    "stallIds": [
      "57949abe-6f09-43d4-a8cf-570e6ddfaa7b",
      "2cd56a88-7103-42de-996f-7c3b03481a0f",
      "8fc74215-d682-4d57-9c39-ea4f0b665946",
      "83ac0695-0b9d-49ef-a3a8-79aef5b9b3a9",
      "473291dc-cf3d-4b80-b1d4-f2cd2bee4fba",
      "4b801872-d533-4e0a-af0a-98b4c712d439",
      "e66b2b58-6bbc-4f9b-98dd-3851d7472d44",
      "36ee1f1a-b829-4ac0-aa1a-fb8f48569a87",
      "f66a478e-7a63-49b7-a7d3-bbc6f3709718",
      "8ccb364b-c5d2-46ea-a223-c1521364067c"
    ]
  },
  {
    "id": "94315111-597e-4260-8e11-49347759825b",
    "code": "D260802V1-K05",
    "floorId": "floor_live_dx",
    "name": "Khu Thực phẩm tươi 1",
    "subTitle": "Khu vực vận hành tập trung",
    "category": "Tổng hợp",
    "geometry": {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 1100,
      "height": 700
    },
    "boundingBox": {
      "minX": 50,
      "minY": 50,
      "maxX": 1150,
      "maxY": 750,
      "width": 1100,
      "height": 700
    },
    "visualTheme": {
      "colorToken": "#076C31"
    },
    "totalStallsCount": 10,
    "stallIds": [
      "fb1d443e-5f5c-4a9e-9562-026ace0e1ba6",
      "bcb26809-c772-480c-87f6-479070b1dfc3",
      "e894a23b-9b36-46ef-975a-453040b42f85",
      "b09301a7-24a7-4c1c-b8af-a78eedb939b7",
      "de95bc08-0ce6-457c-95ee-c1ba7f1cb40c",
      "38888639-4e7d-413f-aa85-312119402e9f",
      "fb971506-a9db-49a0-a994-fc5acea12417",
      "b74e0485-9d0a-4df2-8399-5babf6ef96e1",
      "8619f232-1e18-462b-ac2c-c8375828ff3f",
      "51e9b527-2492-4355-aa68-a622b130161a"
    ]
  },
  {
    "id": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "code": "D260802V1-K06",
    "floorId": "floor_live_dx",
    "name": "Khu Nông sản chọn lọc 2",
    "subTitle": "Khu vực vận hành tập trung",
    "category": "Tổng hợp",
    "geometry": {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 1100,
      "height": 700
    },
    "boundingBox": {
      "minX": 50,
      "minY": 50,
      "maxX": 1150,
      "maxY": 750,
      "width": 1100,
      "height": 700
    },
    "visualTheme": {
      "colorToken": "#076C31"
    },
    "totalStallsCount": 10,
    "stallIds": [
      "a12f0b0f-6c69-4f56-88d2-bba38fe496d4",
      "4cca7d61-972d-47b1-8a57-5b5e7dc0b844",
      "f849ee01-66d1-461d-93ee-0e8d39a19bf1",
      "9580634d-fb42-44d1-92fe-1b7cf377773f",
      "d9e9e337-7439-4fb2-a4d6-22006258e3ea",
      "ab60bc99-d86b-419d-a63a-c5357abd9f24",
      "195ca42e-dee5-4fbe-9a18-ba41a066bc28",
      "eaf4695a-a312-41e6-9983-ed51e020984a",
      "79d05346-6f1b-47ad-a934-80335ad33454",
      "b545d89b-b31e-4712-80f8-e8d754f5a630"
    ]
  },
  {
    "id": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "code": "D260802V1-K07",
    "floorId": "floor_live_dx",
    "name": "Khu Đặc sản địa phương 3",
    "subTitle": "Khu vực vận hành tập trung",
    "category": "Tổng hợp",
    "geometry": {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 1100,
      "height": 700
    },
    "boundingBox": {
      "minX": 50,
      "minY": 50,
      "maxX": 1150,
      "maxY": 750,
      "width": 1100,
      "height": 700
    },
    "visualTheme": {
      "colorToken": "#076C31"
    },
    "totalStallsCount": 10,
    "stallIds": [
      "8e1e945c-3637-4b51-85de-03092484afc3",
      "ca4640a4-59f9-40db-b804-429c53ec78c8",
      "70397e56-fb6d-44b1-b27d-624dba01818c",
      "ec74b6b1-5a47-4711-93fd-84f90b2b7bfb",
      "3a14207d-429d-415d-b44e-156e3faf2bc0",
      "fdeea08f-bb8d-48d0-9d53-576e39d55482",
      "d22a25a3-6571-4f19-aa4c-0b6e591825ed",
      "1de98f51-a94d-4f7f-8fae-444727155915",
      "06ee709d-edb0-4d4d-b0e0-2d0cb39a3589",
      "6065983a-5988-4c09-aade-f9b96c47f252"
    ]
  },
  {
    "id": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "code": "D260802V1-K08",
    "floorId": "floor_live_dx",
    "name": "Khu Hàng thiết yếu 4",
    "subTitle": "Khu vực vận hành tập trung",
    "category": "Tổng hợp",
    "geometry": {
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 1100,
      "height": 700
    },
    "boundingBox": {
      "minX": 50,
      "minY": 50,
      "maxX": 1150,
      "maxY": 750,
      "width": 1100,
      "height": 700
    },
    "visualTheme": {
      "colorToken": "#076C31"
    },
    "totalStallsCount": 10,
    "stallIds": [
      "d6d388e4-9817-42f7-8b24-c19820a7f560",
      "16f85dc7-ca15-4ee1-bc1f-0debd000aec2",
      "fc999b7a-c5c2-4999-a3e5-7e9e0e456aa6",
      "c97222d3-9ab7-4dc7-b302-dc4adc89693f",
      "40a0d732-4179-45e6-aab7-d7a3372715a1",
      "7a500a1e-cbb6-4fd8-9a73-5c2fa1f29c63",
      "50399aa6-f341-4ba6-af81-de976d1c4730",
      "7e9b56f5-010d-4ca1-8713-4ceb094c8bf7",
      "327c7c97-7928-4f0e-ae20-7375258059cd",
      "51171698-690d-4bda-bb08-cbbee9113f0f"
    ]
  }
] as ZoneEntity[];

export const LIVE_STALLS: StallEntity[] = [
  {
    "id": "fb1d443e-5f5c-4a9e-9562-026ace0e1ba6",
    "code": "D900-03",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 76,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 76,
      "maxX": 863,
      "maxY": 103,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D900-03",
      "phone": "0969000008",
      "category": "Thực phẩm tươi 1",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D900-03_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "a12f0b0f-6c69-4f56-88d2-bba38fe496d4",
    "code": "D901-03",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 322,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 322,
      "maxX": 287,
      "maxY": 349,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D901-03",
      "phone": "0969000016",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D901-03_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "8e1e945c-3637-4b51-85de-03092484afc3",
    "code": "D902-03",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 322,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 322,
      "maxX": 863,
      "maxY": 349,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D902-03",
      "phone": "0969000024",
      "category": "Đặc sản địa phương 3",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D902-03_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "d6d388e4-9817-42f7-8b24-c19820a7f560",
    "code": "D903-03",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 567,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 567,
      "maxX": 287,
      "maxY": 594,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D903-03",
      "phone": "0969000032",
      "category": "Hàng thiết yếu 4",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "16f85dc7-ca15-4ee1-bc1f-0debd000aec2",
    "code": "D903-04",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 567,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 567,
      "maxX": 539,
      "maxY": 594,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D903-04",
      "phone": "0969000033",
      "category": "Hàng thiết yếu 4",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "bcb26809-c772-480c-87f6-479070b1dfc3",
    "code": "D900-04",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 76,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 76,
      "maxX": 1107,
      "maxY": 103,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D900-04",
      "phone": "0969000009",
      "category": "Thực phẩm tươi 1",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "ca4640a4-59f9-40db-b804-429c53ec78c8",
    "code": "D902-04",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 322,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 322,
      "maxX": 1107,
      "maxY": 349,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D902-04",
      "phone": "0969000025",
      "category": "Đặc sản địa phương 3",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "4cca7d61-972d-47b1-8a57-5b5e7dc0b844",
    "code": "D901-04",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 322,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 322,
      "maxX": 539,
      "maxY": 349,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D901-04",
      "phone": "0969000017",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "70397e56-fb6d-44b1-b27d-624dba01818c",
    "code": "D902-05",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 359,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 359,
      "maxX": 863,
      "maxY": 386,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D902-05",
      "phone": "0969000026",
      "category": "Đặc sản địa phương 3",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "57949abe-6f09-43d4-a8cf-570e6ddfaa7b",
    "code": "D04-05",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 70,
      "y": 79,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 70,
      "minY": 79,
      "maxX": 173,
      "maxY": 124,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D04-05",
      "phone": "0969000002",
      "category": "Rau củ quả",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "fc999b7a-c5c2-4999-a3e5-7e9e0e456aa6",
    "code": "D903-05",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 604,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 604,
      "maxX": 287,
      "maxY": 631,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D903-05",
      "phone": "0969000034",
      "category": "Hàng thiết yếu 4",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "e894a23b-9b36-46ef-975a-453040b42f85",
    "code": "D900-05",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 114,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 114,
      "maxX": 863,
      "maxY": 141,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D900-05",
      "phone": "0969000010",
      "category": "Thực phẩm tươi 1",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "f849ee01-66d1-461d-93ee-0e8d39a19bf1",
    "code": "D901-05",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 359,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 359,
      "maxX": 287,
      "maxY": 386,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D901-05",
      "phone": "0969000018",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "b09301a7-24a7-4c1c-b8af-a78eedb939b7",
    "code": "D900-06",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 114,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 114,
      "maxX": 1107,
      "maxY": 141,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia vị",
      "merchantName": "Tiểu thương D900-06",
      "phone": "0969000011",
      "category": "Thực phẩm tươi 1",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D900-06_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Nhân viên phục vụ chưa hướng dẫn rõ cho khách. Mã hồ sơ demo #075.",
          "category": "service_attitude",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-08-22T13:11:22.655Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "ec74b6b1-5a47-4711-93fd-84f90b2b7bfb",
    "code": "D902-06",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 359,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 359,
      "maxX": 1107,
      "maxY": 386,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia vị",
      "merchantName": "Tiểu thương D902-06",
      "phone": "0969000027",
      "category": "Đặc sản địa phương 3",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D902-06_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Đề nghị BQL kiểm tra và phản hồi trong ngày. Mã hồ sơ demo #095.",
          "category": "other",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-08-02T13:11:22.742Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "2cd56a88-7103-42de-996f-7c3b03481a0f",
    "code": "D04-06",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 196,
      "y": 79,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 196,
      "minY": 79,
      "maxX": 299,
      "maxY": 124,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia vị",
      "merchantName": "Tiểu thương D04-06",
      "phone": "0969000003",
      "category": "Rau củ quả",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D04-06_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Giá niêm yết và giá bán thực tế chưa đồng nhất. Mã hồ sơ demo #065.",
          "category": "price_issue",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-06-18T13:11:22.613Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "c97222d3-9ab7-4dc7-b302-dc4adc89693f",
    "code": "D903-06",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 604,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 604,
      "maxX": 539,
      "maxY": 631,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia vị",
      "merchantName": "Tiểu thương D903-06",
      "phone": "0969000035",
      "category": "Hàng thiết yếu 4",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "9580634d-fb42-44d1-92fe-1b7cf377773f",
    "code": "D901-06",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 359,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 359,
      "maxX": 539,
      "maxY": 386,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia vị",
      "merchantName": "Tiểu thương D901-06",
      "phone": "0969000019",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D901-06_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Lối đi khu vực này bị trơn khi trời mưa. Mã hồ sơ demo #085.",
          "category": "infrastructure",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-08-12T13:11:22.701Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "de95bc08-0ce6-457c-95ee-c1ba7f1cb40c",
    "code": "D900-07",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 151,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 151,
      "maxX": 863,
      "maxY": 178,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy đặc sản",
      "merchantName": "Tiểu thương D900-07",
      "phone": "0969000012",
      "category": "Thực phẩm tươi 1",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "reserved",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "40a0d732-4179-45e6-aab7-d7a3372715a1",
    "code": "D903-07",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 642,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 642,
      "maxX": 287,
      "maxY": 669,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy đặc sản",
      "merchantName": "Tiểu thương D903-07",
      "phone": "0969000036",
      "category": "Hàng thiết yếu 4",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "reserved",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "3a14207d-429d-415d-b44e-156e3faf2bc0",
    "code": "D902-07",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 396,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 396,
      "maxX": 863,
      "maxY": 423,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy đặc sản",
      "merchantName": "Tiểu thương D902-07",
      "phone": "0969000028",
      "category": "Đặc sản địa phương 3",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "reserved",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "d9e9e337-7439-4fb2-a4d6-22006258e3ea",
    "code": "D901-07",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 396,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 396,
      "maxX": 287,
      "maxY": 423,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy đặc sản",
      "merchantName": "Tiểu thương D901-07",
      "phone": "0969000020",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "reserved",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "8fc74215-d682-4d57-9c39-ea4f0b665946",
    "code": "D04-07",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 322,
      "y": 79,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 322,
      "minY": 79,
      "maxX": 425,
      "maxY": 124,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy đặc sản",
      "merchantName": "Tiểu thương D04-07",
      "phone": "0969000004",
      "category": "Rau củ quả",
      "areaM2": 7,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "reserved",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "83ac0695-0b9d-49ef-a3a8-79aef5b9b3a9",
    "code": "D04-08",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 448,
      "y": 79,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 448,
      "minY": 79,
      "maxX": 551,
      "maxY": 124,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D04-08",
      "phone": "0969000005",
      "category": "Rau củ quả",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "38888639-4e7d-413f-aa85-312119402e9f",
    "code": "D900-08",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 151,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 151,
      "maxX": 1107,
      "maxY": 178,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D900-08",
      "phone": "0969000013",
      "category": "Thực phẩm tươi 1",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "ab60bc99-d86b-419d-a63a-c5357abd9f24",
    "code": "D901-08",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 396,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 396,
      "maxX": 539,
      "maxY": 423,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D901-08",
      "phone": "0969000021",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "fdeea08f-bb8d-48d0-9d53-576e39d55482",
    "code": "D902-08",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 396,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 396,
      "maxX": 1107,
      "maxY": 423,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D902-08",
      "phone": "0969000029",
      "category": "Đặc sản địa phương 3",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "7a500a1e-cbb6-4fd8-9a73-5c2fa1f29c63",
    "code": "D903-08",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 642,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 642,
      "maxX": 539,
      "maxY": 669,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Gian hàng gia dụng",
      "merchantName": "Tiểu thương D903-08",
      "phone": "0969000037",
      "category": "Hàng thiết yếu 4",
      "areaM2": 4,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "195ca42e-dee5-4fbe-9a18-ba41a066bc28",
    "code": "D901-09",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 434,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 434,
      "maxX": 287,
      "maxY": 461,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D901-09",
      "phone": "0969000022",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "fb971506-a9db-49a0-a994-fc5acea12417",
    "code": "D900-09",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 188,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 188,
      "maxX": 863,
      "maxY": 215,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D900-09",
      "phone": "0969000014",
      "category": "Thực phẩm tươi 1",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "d22a25a3-6571-4f19-aa4c-0b6e591825ed",
    "code": "D902-09",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 434,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 434,
      "maxX": 863,
      "maxY": 461,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D902-09",
      "phone": "0969000030",
      "category": "Đặc sản địa phương 3",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "473291dc-cf3d-4b80-b1d4-f2cd2bee4fba",
    "code": "D04-09",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 70,
      "y": 142,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 70,
      "minY": 142,
      "maxX": 173,
      "maxY": 187,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D04-09",
      "phone": "0969000006",
      "category": "Rau củ quả",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "50399aa6-f341-4ba6-af81-de976d1c4730",
    "code": "D903-09",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 679,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 679,
      "maxX": 287,
      "maxY": 706,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Quầy ăn nhanh",
      "merchantName": "Tiểu thương D903-09",
      "phone": "0969000038",
      "category": "Hàng thiết yếu 4",
      "areaM2": 5,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "4b801872-d533-4e0a-af0a-98b4c712d439",
    "code": "D04-10",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 196,
      "y": 142,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 196,
      "minY": 142,
      "maxX": 299,
      "maxY": 187,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D04-10",
      "phone": "0969000007",
      "category": "Rau củ quả",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "eaf4695a-a312-41e6-9983-ed51e020984a",
    "code": "D901-10",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 434,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 434,
      "maxX": 539,
      "maxY": 461,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D901-10",
      "phone": "0969000023",
      "category": "Nông sản chọn lọc 2",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "b74e0485-9d0a-4df2-8399-5babf6ef96e1",
    "code": "D900-10",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 188,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 188,
      "maxX": 1107,
      "maxY": 215,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D900-10",
      "phone": "0969000015",
      "category": "Thực phẩm tươi 1",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "7e9b56f5-010d-4ca1-8713-4ceb094c8bf7",
    "code": "D903-10",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 679,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 679,
      "maxX": 539,
      "maxY": 706,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D903-10",
      "phone": "0969000039",
      "category": "Hàng thiết yếu 4",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "1de98f51-a94d-4f7f-8fae-444727155915",
    "code": "D902-10",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 434,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 434,
      "maxX": 1107,
      "maxY": 461,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp thực phẩm tươi",
      "merchantName": "Tiểu thương D902-10",
      "phone": "0969000031",
      "category": "Đặc sản địa phương 3",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "e66b2b58-6bbc-4f9b-98dd-3851d7472d44",
    "code": "A-01",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 322,
      "y": 142,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 322,
      "minY": 142,
      "maxX": 425,
      "maxY": 187,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": null,
      "merchantName": "Tiểu thương A-01",
      "phone": "0911000001",
      "category": "Rau củ quả",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 2,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "36ee1f1a-b829-4ac0-aa1a-fb8f48569a87",
    "code": "A-02",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 448,
      "y": 142,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 448,
      "minY": 142,
      "maxX": 551,
      "maxY": 187,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": null,
      "merchantName": "Chưa gán tiểu thương",
      "phone": "",
      "category": "Thịt",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_A-02_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "f66a478e-7a63-49b7-a7d3-bbc6f3709718",
    "code": "A-03",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 70,
      "y": 204,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 70,
      "minY": 204,
      "maxX": 173,
      "maxY": 249,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": null,
      "merchantName": "Chưa gán tiểu thương",
      "phone": "",
      "category": "Rau củ quả",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_A-03_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "8ccb364b-c5d2-46ea-a223-c1521364067c",
    "code": "A-04",
    "zoneId": "26c02053-ffb4-4d33-81d8-d5077bb5c74b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 196,
      "y": 204,
      "width": 103,
      "height": 45,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 196,
      "minY": 204,
      "maxX": 299,
      "maxY": 249,
      "width": 103,
      "height": 45
    },
    "rotation": 0,
    "metadata": {
      "name": null,
      "merchantName": "Chưa gán tiểu thương",
      "phone": "",
      "category": "Rau củ quả",
      "areaM2": 6,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": false,
      "occupancyStatus": "empty",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "A"
      ]
    }
  },
  {
    "id": "8619f232-1e18-462b-ac2c-c8375828ff3f",
    "code": "D260802V1-S09",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 226,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 226,
      "maxX": 863,
      "maxY": 253,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Rau củ quả Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S09",
      "phone": "0398260008",
      "category": "Rau củ quả",
      "areaM2": 12,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D260802V1-S09_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Đơn hàng giao thiếu sản phẩm so với xác nhận. Mã hồ sơ demo #070.",
          "category": "order_issue",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-06-13T13:11:22.634Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 2,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "51e9b527-2492-4355-aa68-a622b130161a",
    "code": "D260802V1-S10",
    "zoneId": "94315111-597e-4260-8e11-49347759825b",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 226,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 226,
      "maxX": 1107,
      "maxY": 253,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Thịt Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S10",
      "phone": "0398260009",
      "category": "Thịt",
      "areaM2": 14,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D260802V1-S10_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K05"
      ]
    }
  },
  {
    "id": "79d05346-6f1b-47ad-a934-80335ad33454",
    "code": "D260802V1-S11",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 471,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 471,
      "maxX": 287,
      "maxY": 498,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Hải sản Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S11",
      "phone": "0398260010",
      "category": "Hải sản",
      "areaM2": 16,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D260802V1-S11_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Đề nghị kiểm tra lại chất lượng hàng hóa tại quầy. Mã hồ sơ demo #080.",
          "category": "product_quality",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-08-17T13:11:22.677Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 2,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "b545d89b-b31e-4712-80f8-e8d754f5a630",
    "code": "D260802V1-S12",
    "zoneId": "a1c1ed1f-1d79-4ecd-bf6a-8f5afd69c282",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 471,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 471,
      "maxX": 539,
      "maxY": 498,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Đồ khô Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S12",
      "phone": "0398260011",
      "category": "Đồ khô",
      "areaM2": 18,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D260802V1-S12_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K06"
      ]
    }
  },
  {
    "id": "06ee709d-edb0-4d4d-b0e0-2d0cb39a3589",
    "code": "D260802V1-S13",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 656,
      "y": 471,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 656,
      "minY": 471,
      "maxX": 863,
      "maxY": 498,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Gia vị Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S13",
      "phone": "0398260012",
      "category": "Gia vị",
      "areaM2": 12,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D260802V1-S13_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khu vực chế biến cần bổ sung găng tay và che chắn. Mã hồ sơ demo #090.",
          "category": "food_safety",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-08-07T13:11:22.722Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 2,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "6065983a-5988-4c09-aade-f9b96c47f252",
    "code": "D260802V1-S14",
    "zoneId": "d1c487a2-46e5-42a8-bfc8-afe642bfe2a2",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 900,
      "y": 471,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 900,
      "minY": 471,
      "maxX": 1107,
      "maxY": 498,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Ẩm thực Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S14",
      "phone": "0398260013",
      "category": "Ẩm thực",
      "areaM2": 14,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [
        {
          "id": "issue_D260802V1-S14_complaint",
          "type": "complaint",
          "priority": "P0",
          "title": "Khiếu nại đang chờ xử lý từ khách hàng/tiểu thương",
          "category": "Chất lượng phục vụ",
          "status": "pending",
          "slaMinutesLeft": 30,
          "reportedAt": "2026-09-05T14:30:00Z"
        }
      ],
      "hasActiveIssues": true,
      "highestSeverity": "P0",
      "isUnderMaintenance": false,
      "complaintsCount": 1,
      "hasCriticalComplaint": true,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K07"
      ]
    }
  },
  {
    "id": "327c7c97-7928-4f0e-ae20-7375258059cd",
    "code": "D260802V1-S15",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 80,
      "y": 716,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 80,
      "minY": 716,
      "maxX": 287,
      "maxY": 743,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Quần áo Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S15",
      "phone": "0398260014",
      "category": "Quần áo",
      "areaM2": 16,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  },
  {
    "id": "51171698-690d-4bda-bb08-cbbee9113f0f",
    "code": "D260802V1-S16",
    "zoneId": "5d751924-e6d3-425f-b933-fe3081d1c191",
    "floorId": "floor_live_dx",
    "geometry": {
      "type": "rectangle",
      "x": 332,
      "y": 716,
      "width": 207,
      "height": 27,
      "rotation": 0
    },
    "boundingBox": {
      "minX": 332,
      "minY": 716,
      "maxX": 539,
      "maxY": 743,
      "width": 207,
      "height": 27
    },
    "rotation": 0,
    "metadata": {
      "name": "Sạp Gia dụng Thu Hà",
      "merchantName": "Tiểu thương D260802V1-S16",
      "phone": "0398260015",
      "category": "Gia dụng",
      "areaM2": 18,
      "monthlyEstimatedRevenue": "45.000.000đ",
      "rating": 4.5,
      "ratingCount": 18,
      "qrPaymentActive": true
    },
    "state": {
      "isOccupied": true,
      "occupancyStatus": "active",
      "issues": [],
      "hasActiveIssues": false,
      "isUnderMaintenance": false,
      "complaintsCount": 0,
      "hasCriticalComplaint": false,
      "contractDaysLeft": 180,
      "isExpiringSoon": false,
      "isCriticalExpiry": false,
      "feeStatus": "paid",
      "tags": [
        "D260802V1-K08"
      ]
    }
  }
] as StallEntity[];

export const LIVE_FLOOR_DONG_XUAN: FloorEntity = {
  schemaVersion: "3.2.0",
  id: "floor_live_dx",
  marketId: "30000000-0000-4000-8000-000000000002",
  floorNumber: 1,
  name: "Tầng 1 — Chợ Đồng Xuân (Bản đồ thực tế Live)",
  subTitle: "Chợ Đồng Xuân (Demo) · 5 Phân khu · 50 Sạp hàng",
  elevationMeters: 0,
  ceilingHeightMeters: 4.2,
  backgroundImage: "/maps/cho-dx-hn-map.svg",
  coordinateSystem: LIVE_COORDINATE_SYSTEM,
  boundary: {
    type: "polygon",
    vertices: [
      [0, 0],
      [1200, 0],
      [1200, 800],
      [0, 800]
    ]
  },
  zones: LIVE_ZONES,
  stalls: LIVE_STALLS,
  aisles: [],
  gates: [
    {
      id: "gate_main",
      code: "GATE_CHINH",
      floorId: "floor_live_dx",
      name: "Cổng Chính (Lối vào)",
      type: "main_entry",
      geometry: {
        type: "rectangle",
        x: 520,
        y: 650,
        width: 160,
        height: 50
      },
      orientationDegrees: 180,
      connectedStreet: "Phố Đồng Xuân",
      widthMeters: 4.0,
      isOpen: true
    }
  ],
  facilities: [],
  infrastructures: [],
  incidents: []
};

1. Test ช่อง Create Memo (done เหลือpopup)
A. ข้อมูลปกติ ใช้เช็ก happy path +
B. ช่องว่างทั้งหมด +
C. ข้อความยาวมาก +
D. อักขระพิเศษ / emoji / script +
E. จำนวนเป็น 0 +
F. จำนวนติดลบ +
G. ราคาเป็น 0  - ควรแจ้งว่า price ต้องมากกว่า 0 (update popup restrictor)***
H. ราคาติดลบ +
I. ราคาสูงมาก - เพิ่ม trigger approval พิเศษ ราคารวมไม่ให้รวม1ล้านบาท(update popup restrictor)***
J. Decimal หลายตำแหน่ง -จำนวนต้องเป็นint ระบบควรปัดทศนิยมตามที่กำหนด เช่น 2 ตำแหน่ง
K. วันที่ย้อนหลัง + 
L. วันที่ไกลมาก - ให้ไม่เกิน1ปี (update popup restrictor)***



2. Test หน้า Vendor Proposal / เลือก Vendor (done)
-Vendor proposals can only be submitted from the purchasing stage (ทำให้เป็นpopupแทนและไม่อนุญาติให้กดeditได้)
A. Vendor ปกติ 4 เจ้า +
B. ไม่เลือก Vendor เลย +
C. Vendor ชื่อยาวมาก +
D. Vendor ราคาติดลบ +
E. Vendor ราคา 0 - (ไม่ควรอนุญาติตั้งแต่สร้าง)(update popup restrictor)***
F. Lead time เป็น 0 +
G. Lead time ติดลบ - ต้อง reject(update popup restrictor)***

3. Test หน้า Approver (done)
A. อนุมัติ Memo ปกติ +
B. ปฏิเสธ / ขอแก้ไข พร้อมเหตุผล +
C. ปฏิเสธโดยไม่กรอกเหตุผล +
D. เหตุผลยาวมาก +

4. Test หน้า Vendor ยืนยันส่งสินค้า (done)
-ถ้าผ่านqcแล้วไม่ควรแก้ไขสถานะจัดส่งได้
A. อัปเดตสถานะปกติ +
B. Tracking ว่าง +
C. Tracking ยาวมาก -ui แตกข้อความทะลุกล่อง
D. วันที่จัดส่งย้อนหลัง -ต้องreject หรือ warning
E. Note มี script +

5. Test หน้า Receiving / QC + (later)

6. Test หน้า Payment + (done)

7. Test Login + (done)

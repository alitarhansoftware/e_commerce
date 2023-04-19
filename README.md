# E-COMMERCE

## PROJEYİ ÇALIŞTIRMAK İÇİN

 * Öncelikle projede bulunan dest klasörünü silin.
 
 * Proje ana dizindeyken npm i yapılmalıdır.
 * npm start komutu çalıştırılarak TypeScript kodlarının JavaScript'e dönüştürülmesi       sağlanır.
 *Dönüştürülen kodlar "dest" adında bir klasöre çıkartılır .

 * Ardından dest klasöründe ana dizine aşağıda bilgileri verilen .env dosyasını ekleyin
 *  cd komutu ile bu dest klasörüne geçilerek node start diyerek uygulama ayağa kaldırılabilir.
 
 * Testleri çalıştırmak için yine dest klasörünün olduğundan emin olduktan sonra dest klasörünün içindeki test klasörüne geçiş yapılarak **npm test** komutu çalıştırılır.
 
 * DB bağlantıları yapılmalıdır. 
 
 * NOT : **github içerisine node_modules dosyası yollanmayacağından dolayı dosyayı silip başka bir kullanıcı bu adımları tamamlıyor gibi simülasyon yaptım. Bunun sonucunda npm i yaptığım zaman bcrypt paketi sıkıntı çıkardı ve  şu adımları izleyerek çözdüm.**
 
 1) npm install -g node-pre-gyp
 2) npm install bcrypt
 
 * Bu hatayı alırsanız bu işlemlerden sonra hem ana dizindeyken hem dest klasörünün içindeyken tekrar npm i yapmanız daha garanti bir yol olacaktır.

 
 ## .env Not
 ***Gizli şifreler için .env dosyası kullanılmalıdır.** Bu dosya github'a gönderilirken    gitignore içerisie konur ve kesinlikle gönderilmez.
 
 ## .env Dosyası İçeriği
 
 ```
 JWT_SECRET=project_JWT_SECRET
 ```

 
 ## TABLOLAR
* **Customer** ---------------> Müşterilerin bilgileri bulunur.
* **Customer_Order**-------> Müşterilerin sipariş bilgileri genel hatlarıyla bulunur.
***Customer_SubOrder**---> Müşterilerin siparişleri detaylarıyla bulunur( Ürünler vs. )
***Customer_Address**-----> Müşterilerin adres bilgileri bulunur.
***App_Authority**-----------> Uygulama sorumlularının bilgileri bulunur.
***Product**-------------------> Ürün bilgileri bulunur.
***User_Activity**--------------> Müşterilerin ve uygulama sorumlularının uygulama
içerisindeki hareketleri bulunur. ( login, upsertProduct vs vs)


* #### Tablolar arasında Foreign-Key  Primary-Key ilişkileri mevcuttur.

* #### Tabloların içerisindeki sütunlar ve bunların typeları uygulama ihtiyacına göre hazırlanmıştır.

* #### PRODUCT tablomuz katı verimizin gömülü olduğu tablodur. Bu tablo üzerinden ürün silme işlemlerinin kolay yapılması için hiçbir tablo ile bir PK-FK bağlantısı bu tablo için kurulmamıştır. 


## METODLAR

### MÜŞTERİNİN KULLANDIĞI METODLAR
* **Register_Customer** ------------------------> Müşteri sisteme kayıt olur.
* **Login_Customer**----------------------------> Müşteri sisteme giriş yapar.
* **Add_Address**-------------------------------> Müşteri profiline adres ekler.
* **Get_Products**------------------------------->Sistemdeki ürünleri döner.
* **Create_Order**-------------------------------> Müşteri sipariş oluşturmak için kullanır.
* **List_Orders**---------------------------------> Müşterinin tüm siparişlerini özet biçimde getirir.
* **Get_Order_Detail_With_OrderId**----------> Müşterinin orderId si belirli bir siparişinin detayını getirir.
* **Get_All_Orders_With_Detail**--------------->Müşterinin tüm siparişlerini detaylarıyla birlikte getirir.


#### GENEL SİPARİŞ AKIŞI



* **Tüm değerler hem zod kütüphanesi ile hem de postgres ile uygun formatta olacak şekilde sınırlandırılmıştır. (Örneğin email , phoneNumber , name uzunluk sınırı ... )**


1) Müşteri sisteme kayıt olur. Burada email adresi unique olarak belirlenmiştir ve aynı **email adresi ile 1 kez kayıt yapılabilir.** Telefon numarası da aynı şekildedir. **Aynı telefon numarası ile 1 kez kayıt yapılabilir.**

2) Müşteri , kayıt olduğu bilgiler ile sisteme giriş yapar. Burada giriş yapan her müşteri için bir BEARER TOKEN oluşturulur. Artık müşteri yapmak istediği tüm isteklerde bu token ile gelmek zorundadır. Aksi halde erişimi engellenir.

3) Giriş yapan müşteri profili kısmına gelerek burada adres ekleme işlemleri yapar.

4) Sipariş vermek isteyen müşteri istek attığı zaman tüm ürünler getProduct metodu ile müşteriye gösterilir. getProduct metodundan dönen verilerin bir kısmı bizim createOrder metodumuzun body'sini oluşturacaktır. Kulanıcı istediği ürünleri sepetine ekler. Client bizim order tablomuza uygun bir formatta bize createOrder ile isteği gönderir.

5) **CreteOrder metodu uygulamamızın en kritik kısmıdır.** İçerisindeki bazı tedbirler şöyledir.
  * Gelen  istek içerisindeki ürün adları gerçekten Product tablomuzda var mı bakılır. Yoksa "Ürün sistemde kayıtlı değildir şeklinde hata atılır."
  
  * Gelen istek içerisinde userId gerçekten Customer tablosunda kayıtlı mı bakılır. Yoksa hata atılır.
  
  * UserId sistemde kayıtlıysa gelen istek içerisindeki addressId parametresi gerçekten o userId'ye ait mi diye bakılır yoksa hata atılır.
  
  * Bu kontrollerdan geçen siparişte istekte gelen her ürün miktarı için Product tablosunda yeterli stoğu var mı yok mu kontrol edilir.
  
  * Tüm bu kontrollerde geçen sipariş başarılı kabul edilir. İlgili tablolara verilerimiz kaydedilir.
  
  * Başarılı olan siparişteki satın alınanlar Product tablosunda ürün stoğundan düşülür.
6) Başarılı şekilde sipariş veren müşteri siparişlerinin hepsini veya istediği bir siparişi detay şekilde görebilir.
  
  
### UYGULAMA SORUMLUSUNUN KULLANDIĞI METODLAR

#### *Burada önemli bir nokta vardır. app_authority tablosunda bu bilgiler önceden kayıtlı olmalıdır. Bunun nedeni Admin_all kullanıcısının zaten sistem yetkilileri tarafından kayıt edilmesidir. Admin_all kişisi 1 tanedir. Bu yüzden bu kullanıcı için sisteme kayıt metodu yazıp sistemi kalabalıklaştırmak  yerine direkt olarak DB ye eklenmiştir.

|user_id | first_name |  last_name  | app_role | email | phone_number | password |
| ------ | --- |------| ------|------|------|-----|
| Admin_all | Admin |  Admin    |  Admin   |    admin@com.tr   |   (555)-555-55-55   |  $2b$10$x.8idmT3yGlO9n4z/v5Uee0ZJeqpaaRvKTQF.7mGENd97rlQzVkne   |


* Eğer tablonuzda bu veri yoksa aşağıdaki kodu pgAdmin konsolunda çalıştırırsanız gereklilikler sağlanacaktır.
```sh
INSERT INTO app_authority (user_id, first_name, last_name, app_role, email, phone_number, password)
VALUES ('Admin_All', 'Admin', 'Admin', 'Admin', 'admin@com.tr', '(555)-555-55-55', '$2b$10$x.8idmT3yGlO9n4z/v5Uee0ZJeqpaaRvKTQF.7mGENd97rlQzVkne');
```

* **Add_User_By_Admin** ------------------------> Admin kullanıcısı sisteme yeni sorumlular eklemek için bu metodu kullanır. Sadece Admin_All kişisi bu metodu kullanabilir.
* **Login_Authority**----------------------------> Admin tarafından sisteme eklenen sorumlular bilgileri ile sisteme giriş yapmak için bu metodu kullanır.
* **Upsert_Product**-------------------------------> **Yeni ürün eklemek** ve **ürün bilgilerini güncellemek** için bu metod kullanılır. Sadece Admin_Product kişisi bu metodu kullanabilir.




* Yeni bir kullanıcı eklemek için (add_user_by_admin) bir Admin_All tokenına ihtiyaç vardır. Admin bilgileri sisteme otomatik eklendiğinden dolayı  admin direk olarak kullanıcı ekleme işlemlerine başlayabilir.Giriş bilgileri  **email : admin@com.tr**   **password : Admin1234** şeklindedir.**(login_authority metodu ile giriş yapar)** Token içerisinde app_role kontrolü olduğu için **Admin_All kişisi sisteme eklenirken mutlaka yukardaki tabloda olan bilgilerle eklenmelidir . Aksi halde metoda erişim sağlayamaz. Giriş başarılı olduğu taktirde token alınır ve add_user_by_admin metodu isteği içerisinde gönderilir.**



* UpsertProduct yapabilecek admin bilgileri şu şekilde olmalıdır.

```
 {
    "firstName": "Admin_product",
    "lastName": "Admin_product",
    "appRole": "Admin_product",
    "email": "adminproduct@com.tr",
    "phoneNumber":"(555)-444-44-44",
    "password": "Adminproduct1234"
 }

```

* **Burada Admin_product'ın erişebileceği metodlar BEARER token ile kontrol edilirken appRole ve email parametrelerine bakıldığı için sisteme Admin ekleyen Admin_All kişisinin mutlaka bu iki parametreyi yukardaki ile aynı girmesi gerekmektedir.**


* **Sisteme Admin_All tarafından eklenen diğer adminler Login_Authority metodunu kullanarak sisteme giriş yapmak zorundadır. Doğru bilgilerle giriş yapmaları halinde bir token üretilir. Artık bundan sonra tüm işlemlerde (upserProduct) bu token da istekle beraber gelmelidir. Aksi halde metoda erişim sağlanamaz.**

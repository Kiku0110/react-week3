import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import * as bootstrap from 'bootstrap'
import "./assets/style.css";
import Swal from 'sweetalert2';

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

//初始化資料
const INITIAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const [isAuth, setIsAuth] = useState(false);

  const [products, setProducts] = useState([]);
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState("");

  const productModalRef = useRef('');

  const handleInputChange = (e) =>{
    const {name, value} = e.target;
    setFormData((preData)=>({
      ...preData,
      [name]: value,
    }));
  };

  const handleModalInputChange = (e) =>{
    const {name, value, checked, type} = e.target;
    setTemplateProduct((preData)=>({
      ...preData,
      [name]: type === 'checkbox'? checked : value,
    }));
  }

  const handleModalImageChange = (index, value) =>{
    setTemplateProduct((prev) =>{
      const newImage = [...prev.imagesUrl];
      newImage[index] = value;
      return{
        ...prev,
        imagesUrl: newImage
      }
    })
  }

  const handleAddImage = () =>{
    setTemplateProduct((prev) =>{
      const newImage = [...prev.imagesUrl];
      newImage.push("");
      return{
        ...prev,
        imagesUrl: newImage
      }
    })
  }

  const handleDeleteImage = () =>{
    setTemplateProduct((prev) =>{
      const newImage = [...prev.imagesUrl];
      newImage.pop();
      return{
        ...prev,
        imagesUrl: newImage
      }
    })
  }

  const getProducts = async() =>{
    try {
      const response = axios.get(`${API_BASE}/api/${API_PATH}/admin/products`)
      setProducts((await response).data.products);
    } catch (error) {
      Swal.fire({
        text: `${error.response.data.message}`,
        icon: "error"
      });
    }
  }

  const updateProduct = async(id) =>{
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = "post";

    if(modalType === "edit"){
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = "put";
      Swal.fire({
        text: "已修改完成",
        icon: "success"
      });
    }else{
      Swal.fire("成功建立商品！");
    }

    const productData = {
      //改變初始化資料的型態(字串轉數字)
      //避免 imagesUrl 傳空字串
      data:{
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter(url => url !== "")],
      },
    }

    //axios[method] 可依 if 條件切換成 axios.post 或 axios.put
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await axios[method](url, productData)
      getProducts();
      closeModal();
    } catch (error) {
      Swal.fire({
        text: `${error.response.data.message}`,
        icon: "error"
      });
    }
  }

  const delProduct = async(id) =>{
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`)
      Swal.fire({
        text: `${response.data.message}`,
        icon: "success"
      });
      getProducts();
      closeModal();
    } catch (error) {
      Swal.fire({
        text: `${error.response.data.message}`,
        icon: "error"
      });
    }
  }

  const onSubmit = async(e) =>{
    try{
      e.preventDefault(); //停止原生的預設事件
      const response = await axios.post(`${API_BASE}/admin/signin`,formData)
      //解構取出 Token,expired
      const {token, expired} = response.data;
      // 設定 Cookie
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      // 將 Token 設定到 axios 的預設 Header
      axios.defaults.headers.common['Authorization'] = token;
      Swal.fire({
          text: "登入成功！",
          icon: "success"
        });
      getProducts(); //取得產品列表
      setIsAuth(true); //登入成功畫面為 true
    }catch(error){
      setIsAuth(false); //登入失敗畫面為 false
      Swal.fire({
        text: `${error.response.data.message}`,
        icon: "error"
      });
    }
  }

  useEffect(() =>{
    // 檢查登入狀態
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1]; // 讀取 Cookie
    
    //建立 Modal methods
    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false
    });

    // 檢查管理員權限
    const checkLogin = async()=>{
      try {
        // eslint-disable-next-line no-unused-vars
        const response = await axios.post(`${API_BASE}/api/user/check`)
        Swal.fire({
          text: "重新登入成功！",
          icon: "success"
        });
        setIsAuth(true);
        getProducts();
      } catch (error) {
        Swal.fire({
          text: `${error.response?.data.message}`,
          icon: "error"
        });
      }
    };

    // 有取得 Token 才將 Token 設定到 Header 上
    if(token){
      axios.defaults.headers.common['Authorization'] = token;
      checkLogin();
    }
    
  }, [])

  const openModal = (type, product) =>{
    setModalType(type)
    setTemplateProduct((preData) =>({
      ...preData,
      ...product,
    }));
    productModalRef.current.show();
  }

  const closeModal = () =>{
    productModalRef.current.hide();
  }

  return (
    <>
    {!isAuth ? (
      <div className="container login">
        <h1 className="text-white">請先登入</h1>
        <form className="form-floating" onSubmit={(e)=>onSubmit(e)}>
          <div className="form-floating mb-3">
            <input type="email" className="form-control" name="username" id="username" placeholder="name@example.com" value={formData.username} onChange={(e)=>handleInputChange(e)} />
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating">
            <input type="password" className="form-control" name="password" id="password" placeholder="Password" value={formData.password} onChange={(e)=>handleInputChange(e)} />
            <label htmlFor="password">Password</label>
          </div>
          <button type="submit" className="btn btn-dark w-100 mt-3">登入</button>
        </form>
      </div>):(
        <div className="container">
          {/* 新增產品按鈕 */}
          <div className="text-end mt-4">
            <button type="button" className="btn btn-dark" onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}>
              建立新的產品
            </button>
          </div>
          <h2 className="mt-3 text-center">產品列表</h2>
          <table className="table table-striped text-center">
            <thead>
              <tr>
                <th scope="col">分類</th>
                <th scope="col">產品名稱</th>
                <th scope="col">原價</th>
                <th scope="col">售價</th>
                <th scope="col">是否啟用</th>
                <th scope="col">編輯</th>
              </tr>
            </thead>
            <tbody>
              {
                products.map((product) => {
                  return(
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td className={`${product.is_enabled ? 'text-primary' : ''}`}>{product.is_enabled ? '啟用': '未啟用'}</td>
                      <td>
                        <div className="btn-group" role="group" aria-label="Basic example">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openModal("edit", product)}>編輯</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => openModal("delete", product)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      )
    }

    {/* Modal */}
    <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true" ref={productModalRef}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0">
          <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}>
            <h5 id="productModalLabel" className="modal-title">
              <span>{modalType === 'delete' ? '刪除' : modalType === 'edit' ? '編輯' : '新增'}產品</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              ></button>
          </div>
          <div className="modal-body">
            {
              modalType === 'delete' ? (
                <p className="fs-4">
                  確定要刪除
                  <span className="text-danger">{templateProduct.title}</span>嗎？
                </p>
              ) : (
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        type="text"
                        id="imageUrl"
                        name="imageUrl"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                        value={templateProduct.imageUrl}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                    </div>
                    {/* 判斷是否有圖片的值 */}
                    {
                      templateProduct.imageUrl && (
                      <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />
                      )
                    }
                  </div>
                  <div>
                    {
                      templateProduct.imagesUrl.map((url, index) =>(
                        <div key={index}>
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`圖片網址${index + 1}`}
                            value={url}
                            onChange={(e) => handleModalImageChange(index, e.target.value)}
                          />
                          {
                            url &&(
                              <img
                                className="img-fluid"
                                src={url}
                                alt={`副圖${index + 1}`}
                              />
                            )
                          }
                        </div>
                      ))
                    }
                    <button className="btn btn-outline-primary btn-sm d-block w-100" onClick={() =>handleAddImage()}>
                      新增圖片
                    </button>
                  </div>
                  <div>
                    <button className="btn btn-outline-danger btn-sm d-block w-100" onClick={() =>handleDeleteImage()}>
                      刪除圖片
                    </button>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">標題</label>
                    <input
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                      value={templateProduct.title}
                      onChange={(e) => handleModalInputChange(e)}
                      />
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">分類</label>
                      <input
                        name="category"
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                        value={templateProduct.category}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">單位</label>
                      <input
                        name="unit"
                        id="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入單位"
                        value={templateProduct.unit}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">原價</label>
                      <input
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入原價"
                        value={templateProduct.origin_price}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">售價</label>
                      <input
                        name="price"
                        id="price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入售價"
                        value={templateProduct.price}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">產品描述</label>
                    <textarea
                      name="description"
                      id="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                      value={templateProduct.description}
                      onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">說明內容</label>
                    <textarea
                      name="content"
                      id="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                      value={templateProduct.content}
                      onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        name="is_enabled"
                        id="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={templateProduct.is_enabled}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              )
            }
          </div>
          <div className="modal-footer">
            {
              modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                  刪除
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                    >
                    取消
                  </button>
                  <button 
                    type="button" className="btn btn-primary" 
                    onClick={() => updateProduct(templateProduct.id)}
                  >
                    確認
                  </button>
                </>)
            }
          </div>
        </div>
      </div>
    </div>

    </>
  )
}

export default App;

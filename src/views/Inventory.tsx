import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Utensils, Tag, Box, Plus, QrCode, 
  Trash2, Upload, X, Edit2
} from 'lucide-react';

const Inventory = () => {
  const { 
    menu, categories, settings, addNotification, addDish, addCategory, removeDish, updateDish, removeCategory
  } = useStore();

  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'stock' | 'qr'>('menu');
  
  // Estados para modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Estados para criação local
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '',
    categoryId: '',
    isAvailable: true,
    description: ''
  });

  const [newCategory, setNewCategory] = useState({
    name: ''
  });

  // Estados para upload de imagem
  const [uploadingImage, setUploadingImage] = useState(false);

  // Função de upload de imagem - MODO OFFLINE (SQLite-first)
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      addNotification('error', 'Apenas arquivos de imagem são permitidos');
      return;
    }

    setUploadingImage(true);
    
    try {
      console.log('[Inventory] MODO OFFLINE - Convertendo imagem para base64...');
      
      // Converter para base64 para armazenamento local
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log('[Inventory] Imagem convertida para base64 (modo offline)');
        
        // Atualizar URL no formulário com base64
        setNewProduct(prev => ({
          ...prev,
          image: base64data
        }));
        
        addNotification('success', 'Imagem carregada localmente (modo offline)');
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('[Inventory] Erro no processamento local da imagem:', error);
      addNotification('error', 'Erro ao processar imagem localmente');
    } finally {
      setUploadingImage(false);
    }
  };

  // Criar produto - MODO OFFLINE (SQLite-first)
  const handleSaveProduct = async () => {
    console.log('[Inventory] MODO OFFLINE - Salvando produto localmente...');
    
    // Validações básicas
    if (!newProduct.name || !newProduct.price || !newProduct.categoryId) {
      addNotification('error', 'Preencha nome, preço e categoria');
      return;
    }

    try {
      const priceNumber = parseFloat(newProduct.price);
      
      if (isNaN(priceNumber) || priceNumber <= 0) {
        addNotification('error', 'Preço inválido');
        return;
      }

      // Encontrar categoria local
      const selectedCategory = categories.find(cat => cat.id === newProduct.categoryId);
      if (!selectedCategory) {
        addNotification('error', 'Categoria selecionada não encontrada');
        return;
      }

      // Criar produto para store local
      const localProduct = {
        id: `dish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newProduct.name,
        description: newProduct.description || '',
        price: priceNumber,
        categoryId: newProduct.categoryId,
        image: newProduct.image || undefined,
        costPrice: priceNumber * 0.7, // 70% do preço como custo
        taxCode: null,
        isVisibleDigital: true,
        isFeatured: false,
        isAvailable: newProduct.isAvailable
      };

      console.log('[Inventory] Produto local criado:', localProduct);
      
      // Adicionar ao store local (SQLite-first)
      addDish(localProduct);
      
      // Limpar formulário
      setNewProduct({
        name: '',
        price: '',
        image: '',
        categoryId: '',
        isAvailable: true,
        description: ''
      });
      
      setIsProductModalOpen(false);
      addNotification('success', 'Produto criado localmente com sucesso!');
      
    } catch (error: any) {
      console.error('[Inventory] ❌ ERRO AO CRIAR PRODUTO LOCAL:', error);
      addNotification('error', `Erro ao criar produto: ${error.message}`);
    }
  };

  // Criar categoria - MODO OFFLINE
  const handleSaveCategory = async () => {
    console.log('[Inventory] MODO OFFLINE - Salvando categoria:', newCategory);
    
    if (!newCategory.name || newCategory.name.trim().length === 0) {
      addNotification('error', 'Por favor, digite um nome para a categoria.');
      return;
    }
    
    try {
      // Verificar se categoria já existe
      const categoryExists = categories.some(cat => 
        cat.name.toLowerCase() === newCategory.name.toLowerCase()
      );
      
      if (categoryExists) {
        addNotification('error', 'Uma categoria com este nome já existe.');
        return;
      }

      // Criar categoria local
      const localCategory = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newCategory.name.trim()
      };

      console.log('[Inventory] Categoria local criada:', localCategory);
      
      // Adicionar ao store local
      addCategory(localCategory);
      
      // Limpar formulário
      setNewCategory({ name: '' });
      setIsCategoryModalOpen(false);
      
      addNotification('success', 'Categoria criada localmente com sucesso!');
      
    } catch (error: any) {
      console.error('[Inventory] Erro ao criar categoria:', error);
      addNotification('error', `Erro ao criar categoria: ${error.message}`);
    }
  };

  const formatKz = (val: number) => new Intl.NumberFormat('pt-AO', { 
    style: 'currency', currency: 'AOA', maximumFractionDigits: 0 
  }).format(val);

  const tabs = [
    { id: 'menu', label: 'Produtos', icon: Utensils },
    { id: 'categories', label: 'Categorias', icon: Tag },
    { id: 'stock', label: 'Stock', icon: Box },
    { id: 'qr', label: 'QR Menu', icon: QrCode }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 transition-all ${
                activeTab === tab.id 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={20} className="inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Products ({menu.length})</h2>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="bg-primary text-black px-4 py-2 rounded-lg hover:brightness-110 transition-all"
              >
                <Plus size={20} className="inline mr-2" />
                New Product
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
              {menu.map(dish => (
                <div key={dish.id} className="bg-slate-900 rounded-lg p-6 border border-white/10">
                  {dish.image && (
                    <img 
                      src={dish.image} 
                      alt={dish.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-2">{dish.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{dish.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-bold">{formatKz(dish.price)}</span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(dish);
                          setNewProduct({
                            name: dish.name,
                            price: dish.price,
                            image: dish.image || '',
                            categoryId: dish.categoryId || '',
                            isAvailable: dish.isAvailable,
                            description: dish.description || ''
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-white transition-all"
                        title="Editar produto"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const duplicatedProduct = {
                            name: `${dish.name} (Cópia)`,
                            price: dish.price,
                            image: dish.image || '',
                            categoryId: dish.categoryId || '',
                            isAvailable: dish.isAvailable,
                            description: dish.description || ''
                          };
                          setNewProduct(duplicatedProduct);
                          setIsProductModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-blue-500 transition-all"
                        title="Duplicar produto"
                      >
                        <Plus size={16} />
                      </button>
                      <button className="text-slate-400 hover:text-red-500 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Categories ({categories.length})</h2>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-primary text-black px-4 py-2 rounded-lg hover:brightness-110 transition-all"
              >
                <Plus size={20} className="inline mr-2" />
                New Category
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
              {categories.map(category => (
                <div key={category.id} className="bg-slate-900 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                  <p className="text-slate-400 text-sm">
                    {menu.filter(product => product.categoryId === category.id).length} products
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Stock Management</h2>
            <div className="bg-slate-900 rounded-lg p-8 border border-white/10">
              <p className="text-slate-400">Stock management features coming soon...</p>
            </div>
          </div>
        )}

        {/* QR Tab */}
        {activeTab === 'qr' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">QR Menu Settings</h2>
            <div className="bg-slate-900 rounded-lg p-8 border border-white/10">
              <p className="text-slate-400">QR menu features coming soon...</p>
            </div>
          </div>
        )}

        {/* Product Modal */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-lg p-8 max-w-2xl w-full mx-4 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingProduct ? 'Edit Product' : 'New Product'}
                </h3>
                <button
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      price: '',
                      image: '',
                      categoryId: '',
                      isAvailable: true,
                      description: ''
                    });
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Image</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                    {newProduct.image && (
                      <img 
                        src={newProduct.image} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.isAvailable}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="mr-2"
                  />
                  <label className="text-sm">Available</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="px-4 py-2 bg-primary text-black rounded-lg hover:brightness-110 transition-all"
                >
                  {editingProduct ? 'Update' : 'Create'} Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-lg p-8 max-w-md w-full mx-4 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <button
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                    setNewCategory({ name: '' });
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="px-4 py-2 bg-primary text-black rounded-lg hover:brightness-110 transition-all"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;

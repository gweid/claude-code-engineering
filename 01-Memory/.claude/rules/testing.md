---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/**/__tests__/**"
---

# 测试规范

## 技术栈
- Vitest (测试框架)
- React Testing Library (组件测试)
- MSW (API Mock)

## 文件命名
- 单元测试: `*.test.ts`
- 组件测试: `*.test.tsx`
- 测试放在被测文件同级目录的 `__tests__/` 下

## 测试结构

使用 Arrange-Act-Assert 模式：

```typescript
describe('ProductCard', () => {
  it('should display product name and price', () => {
    // Arrange
    const product = { id: '1', name: 'T-Shirt', price: 99 };

    // Act
    render(<ProductCard product={product} />);

    // Assert
    expect(screen.getByText('T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('¥99')).toBeInTheDocument();
  });
});
```

## 分类规范

### 组件测试
- 测试渲染输出和用户交互
- 使用 `screen.getByRole` 优先于 `getByTestId`
- 避免测试实现细节，关注用户可见行为

### Hooks 测试
- 使用 `renderHook` 测试自定义 Hooks
- TanStack Query hooks 需要包裹 `QueryClientProvider`

```typescript
const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useProducts(), { wrapper });
```

### Store 测试
- Zustand store 直接调用 action 验证状态变化
- 每个测试前重置 store 状态

```typescript
beforeEach(() => {
  useCartStore.setState({ items: [] });
});

it('should add item to cart', () => {
  useCartStore.getState().addItem({ id: '1', name: 'T-Shirt', price: 99 });
  expect(useCartStore.getState().items).toHaveLength(1);
});
```

### API Mock
- 使用 MSW 拦截网络请求
- Mock handlers 统一放在 `src/mocks/handlers.ts`

```typescript
export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json([
      { id: '1', name: 'T-Shirt', price: 99 }
    ]);
  }),
];
```

## 覆盖率要求
- 业务逻辑 (hooks/stores/utils): > 80%
- UI 组件: 关注关键交互路径，不追求行覆盖率
- API 层: 通过集成测试覆盖

## 常用命令
```bash
pnpm test              # 运行所有测试
pnpm test --watch      # 监听模式
pnpm test --coverage   # 生成覆盖率报告
```
